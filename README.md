# wr_hci_hud

@defgroup wr_hci_hud wr_hci_hud
@brief A package to act as a HUD for drivers

The deprecated version of the GUI (With flask and vanilla JS) is in ./OldVersion
The current version is ./frontend (React) and ./backend (Node)

## Current todo list

1. Map implementation
2. Finalize ros topic names, change to global ros connection
3. Emergency stop button and launch script name
4. Make the GUI work for clients other than the host

# To Start the GUI in 3 Easy Steps

## Frontend

In ./frontend

npm install
npm run start

## Backend

In  ./backend

npm install
node index.js

## To start ROS server

The GUI uses Roslib to connect to Rosbridge, which must be running for ROS to work

Have ros2 humble/jazzy installed, install rosbridge_server package, and run

source /opt/ros/jazzy/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml

Running the server with "delay_between_messages:=0.0" could fix a version error.

### Testing the OpenCV Video streaming

Install libraries and run streamProducer.py in ./OldVersion/src/

# To start the Webrtc signalling server for video streaming
1. Change the CameraPanel in the frontend to the gstreamer version. 

2. Build gst-plugins-rs and source with

3. export GST_PLUGIN_PATH=[path to gst-plugins-rs]/target/debug:$GST_PLUGIN_PATH

then run 

4. cargo run --bin gst-webrtc-signalling-server

The streamer would run something like this, which would go through the server and then to the GUI:

5. gst-launch-1.0 webrtcsink name=ws meta="meta,name=gst-stream" signaller::uri="ws://10.141.81.176:8443" mfvideosrc ! videoconvert ! vp8enc deadline=1 ! queue ! video/x-vp8 ! ws.   

May have to set port 5000, 9090 inbound to open in firewall for multiple client 

the ros.js file is publishing and then subscribing to the ros websocket to simulate actual input

# To start the Old GUI from ./OldVersion
npm install
pip install -r requirements.txt

run app.py in wr_hci_hud/src 

## History

Ideas for this node have gone through several iterations.  None of the following have been implemented far enough to have a good estimate for the efficacy of the method:

* A locally hosted webserver on the base station (probably easiest in Python) that live-updates its components to reflect subscriptions over ROS.
  * Pros:
    * Most of the GUI heavy-lifting is taken care of by the web browser
    * Lots of options/documentation for the web server itself
    * Could be accessed/used by any other computer on the network (good for debugging)
  * Cons:
    * May be hidden complexity to configure layout
    * Transporting images/geospatial data (if rendered) may take up a lot of bandwidth
    * Rendering geospatial data/proprioception might not be easy
    * Camera streaming might not be possible due to bandwidth, may still need extra tool
    * Lack of Internet at competition might limit design or force pre-downloaded dependencies
* Qt/Tk/similar locally hosted application that is ROS-aware.
  * Pros:
    * Lots of language options
    * Broad customizability
    * Likely easier ROS integration (due to customizability)
    * Easier to make visual rendering more efficient
  * Cons:
    * Analysis Paralysis
      * The team does more of the legwork on the GUI magic
      * Likely complex configuration
    * Constrained to platform compiled for, or need to distribute the binary
* Direct console access (current solution)
  * Pros:
    * Few/no layers of extra support required between operator and WRover
    * No GUI work
  * Cons:
    * Operator must be ***extremely*** proficient in ROS/`bash`/filesystems/networks
      * No assistance/recovery available if something goes wrong
    * Hard to visualize large number of subsystems at once
    * Slow to operate
    * Hard to construct complex diagnostic tools and insights on the fly
    * Little to no visual support outside of `rqt`

Given past experience at competition, even a small GUI with no input options (a literal HUD) would be massively beneficial compared to reading individaul diagnostics one at a time.  This could then be expanded to provide more detailed insights, inputs to the WRover, and specializations for the different competition modes.

