

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Node3
{
    private earthMesh: gfx.MorphMesh3;

    public globeMode: boolean;

    constructor()
    {
        
        super();

        this.earthMesh = new gfx.MorphMesh3();

        this.globeMode = false;
        this.earthMesh.morphAlpha = 0;  // Start with flat map mode 
    }

    public initialize(): void
    {
         // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMesh.material.texture = new gfx.Texture('./assets/earth-2k.png');

        // These parameters determine the appearance in the wireframe and vertex display modes
        this.earthMesh.material.ambientColor.set(0, 1, 1);
        this.earthMesh.material.pointSize = 10;
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMesh.material.texture.setMinFilter(true, false);   

        // Add the mesh as a child of this node
        this.add(this.earthMesh);
    }


    // You should use meshResolution to define the resolution of your flat map and globe map
    // using a nested loop. 20x20 is reasonable for a good looking sphere, and you don't
    // need to change the default value to complete the base assignment  However, if you want 
    // to use height map or bathymetry data for a wizard bonus, you might need to increase
    // the default mesh resolution to get better results.
    public createMesh(meshResolution: number): void
    {
        // Precalculated vertices and normals for the earth plane mesh.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: gfx.Vector3[] = [];
        const mapNormals: gfx.Vector3[] = [];
        const indices: number[] = [];
        const texCoords: number[] = [];
        const globeVertices: gfx.Vector3[] = [];
        const globeNormals: gfx.Vector3[] = [];



        // Part 1: Creating the Flat Map Mesh
        // As a demonstration, this code creates a rectangle with two triangles.
        // Four vertices are defined for the corners in latitude and longitude. 
        // These values need to be converted to the coordinates for the flat map.
        // You should replace this code with a nested loop as described in the readme.
        // make points(verticies) across the page to map them in the next loop
        // Loop over the mesh resolution to generate vertices and normals
    for (let latitudeindex = 0; latitudeindex < meshResolution; latitudeindex++) {
        for (let longitudeindex = 0; longitudeindex < meshResolution; longitudeindex++) {
            //bottom to top
            const latitude = -90 + (latitudeindex / (meshResolution - 1)) * 180;  // -90 to 90
            //left to right
            const longitude = -180 + (longitudeindex / (meshResolution - 1)) * 360;  // -180 to 180

            //flat map cordinates
            mapVertices.push(this.convertLatLongToPlane(latitude, longitude));
            mapNormals.push(new gfx.Vector3(0, 0, 1));

            //golobe spehere cordinates
            const vertex = this.convertLatLongToSphere(latitude, longitude);
            globeVertices.push(vertex);  //globeVertices
            const length = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z);
            const normal = new gfx.Vector3(vertex.x / length, vertex.y / length, vertex.z / length);
            globeNormals.push(normal);  //globeNormals
        }
    }

        // Define indices into the array for the two triangles.
        // I recommend doing this in another nested loop that is completely separate
        // from the one you added above to define the vertices and normals.
        // loop through the vertiecies
        // Generate indices for two triangles the grid
        // break down into small triangles
    for (let latitudeindex = 0; latitudeindex < meshResolution - 1; latitudeindex++) { //goes through rows
        for (let longitudeindex = 0; longitudeindex < meshResolution - 1; longitudeindex++) { // goes thour collumns
            //define 2 triangles in the square
            //conntects the traingles
            const topLeft = latitudeindex * meshResolution + longitudeindex;
            const topRight = topLeft + 1;
            const bottomLeft = (latitudeindex + 1) * meshResolution + longitudeindex;
            const bottomRight = bottomLeft + 1;

            //the triangles are facing away winding order      -     lecture 12
            //indicies.push(a, b, c ) (0, 2 1)
            //First triangle is defiend as left half 

            //indices.push(topLeft, bottomLeft, topRight);
           indices.push(topLeft, topRight, bottomLeft);
            //Second triangle is defined as right half
            indices.push(bottomLeft, topRight, bottomRight);
        }
    }


        
        // Part 2: Texturing the Mesh
        // You should replace the example code with correct texture coordinates for the flat map.
        //calculates texture cordinates to make sure the image is place along the grid
    for (let latitudeindex = 0; latitudeindex < meshResolution; latitudeindex++) {
        for (let longitudeindex = 0; longitudeindex < meshResolution; longitudeindex++) {
        //texture cordinatntes     vertical and horizontal cordinatnes
            texCoords.push(longitudeindex / (meshResolution - 1), 1 - (latitudeindex / (meshResolution - 1)));
        }
    }


        // Set the flat map mesh data. This functions, which are part of the Mesh3 class, copy
        // the vertices, normals, indices, and texture coordinates from CPU memory to GPU memory. 
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);



        // Part 3: Creating the Globe Mesh
        // You will need to compute another set of vertices and normals for the globe mesh.
        // For debugging purposes, it may be useful to overwrite the flap map vertices and
        // normals using the setVertices() and setNormals() methods above, and then use the
        // wireframe and vertex display modes to visually inspect the structure of the mesh.
        // However, once you are confident the globe vertices and normals are correct, you
        // should to add them to the earth as morph targets using the appropriate functions.
        // You will also need to add code in the convertLatLongToSphere() method below.
       

        
        // After the mesh geometry is updated, we need to recompute the wireframe.
        // This is only necessary for debugging in the wireframe display mode.
        this.earthMesh.material.updateWireframeBuffer(this.earthMesh);
        // switching between flat map and globe
        // Set the globe mesh as morph target
        this.earthMesh.setMorphTargetVertices(globeVertices, true);  // Use globeVertices
        this.earthMesh.setMorphTargetNormals(globeNormals, true);
    }


    public update(deltaTime: number) : void
    {

        // Part 4: Morphing Between the Map and Globe
        // The value of this.globeMode will be changed whenever
        // the user selects flat map or globe mode in the GUI.
        // You should use this boolean to control the morphing
        // of the earth mesh, as described in the readme.
        // Interpolate between the current morphAlpha and the targetAlpha
        // deltaTime to ensure smooth animation over time
        const targetAlpha = this.globeMode ? 1 : 0;
        const morphSpeed = 0.5;  
        this.earthMesh.morphAlpha = gfx.MathUtils.lerp(this.earthMesh.morphAlpha, targetAlpha, deltaTime * morphSpeed);
    }


    public createEarthquake(record: EarthquakeRecord)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        const latitude = record.latitude;
        const longitude = record.longitude;
        const magnitude = record.magnitude;
        // Part 5: Creating the Earthquake Markers
        // Currently, the earthquakes are just placed randomly on the plane. 
        // You will need to update this code to correctly calculate both the 
        // map and globe positions of the markers.

        // calculate both map and globe positions
        const mapPosition = this.convertLatLongToPlane(latitude, longitude);  //flat map
        const globePosition = this.convertLatLongToSphere(latitude, longitude);  //globe

        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Global adjustment to reduce the size. You should probably update the
        // appearance of the earthquake marker in a more meaningful way. 
        const minScale = 0.02;
        const maxScale = 1.0;
        const clampedMagnitude = Math.max(2.0, Math.min(magnitude, 8.0));  
        const scale = gfx.MathUtils.lerp(minScale, maxScale, (clampedMagnitude - 2.0) / (8.0 - 2.0));  //Adjust scale 
        earthquake.scale.set(scale, scale, scale);

        // Uncomment this line of code to add the earthquake markers to the scene
        this.add(earthquake);
    }


    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Node3) => {

            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);

                // The earthquake has exceeded its lifespan and should be moved from the scene
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                // The earthquake position should be updated
                else
                {

                    // Part 6: Morphing the Earthquake Positions
                    // If you have correctly computed the flat map and globe positions
                    // for each earthquake marker in part 5, then you can simply lerp
                    // between them using the same alpha as the earth mesh.

                    const earthquake = quake as EarthquakeMarker;
                    const morphAlpha = this.earthMesh.morphAlpha;
                    const newPosition = gfx.Vector3.lerp(earthquake.mapPosition, earthquake.globePosition, morphAlpha);
                    earthquake.position.copy(newPosition);
                }
            }
        });

    }


    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the flat map coordinate system described in the readme.
    public convertLatLongToPlane(latitude: number, longitude: number): gfx.Vector3
    {
        return new gfx.Vector3(longitude * Math.PI / 180, latitude * Math.PI / 180, 0);
    }


    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the globe mesh map coordinate system described in the readme.
    public convertLatLongToSphere(latitude: number, longitude: number): gfx.Vector3
    {
        
        // Part 3: Creating the Globe Mesh
        // Add code here to correctly compute the 3D sphere position
        // based on latitude and longitude.
        // Convert degrees to radians
        const latitudeInRadians = latitude * Math.PI / 180;
        const longitudeInRadians = longitude * Math.PI / 180;
        // golobe coordinate formulas
        const x = Math.cos(latitudeInRadians) * Math.sin(longitudeInRadians);
        const y = Math.sin(latitudeInRadians);
        const z = Math.cos(latitudeInRadians) * Math.cos(longitudeInRadians);

        return new gfx.Vector3(x, y, z);
    }


    // This function toggles between the textured, wireframe, and vertex display modes
    public changeDisplayMode(displayMode : string)
    {
        if (displayMode == 'Textured')
        {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.SHADED;
        }
        else if (displayMode == 'Wireframe')
        {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.WIREFRAME;
        }
        else if (displayMode == 'Vertices')
        {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.VERTICES;
        }
    }
}