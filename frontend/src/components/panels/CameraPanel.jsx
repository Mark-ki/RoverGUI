/* global GstWebRTCAPI */

import React, { useState, useEffect, useRef } from "react";
import TabButton from "../TabButton";

const CameraPanel = () => {
  const [activeCameraTab, setActiveCameraTab] = useState("CAM1");
  const videoRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    // Ensure GstWebRTCAPI exists
    if (typeof GstWebRTCAPI === "undefined") {
      console.error("GstWebRTCAPI not found. Make sure it's loaded globally.");
      return;
    }

    async function init() {
      const signalingProtocol = window.location.protocol.startsWith("https")
        ? "wss"
        : "ws";
      const gstWebRTCConfig = {
        meta: { name: `WebClient-${Date.now()}` },
        // signalingServerUrl: `${signalingProtocol}://${await getHostIP()}:8443`,
        signalingServerUrl: `${signalingProtocol}://localhost:8443`,
      };

      const api = new GstWebRTCAPI(gstWebRTCConfig);
      initRemoteStreams(api);
    }

    let counter = 0;

    function producerAddedHandler(api, producer, videoRef) {
      const producerId = producer.id;
      const videoElement = videoRef.current;

      if (!videoElement) return;

      if (videoElement._consumerSession) {
        videoElement._consumerSession.close();
      }

      const session = api.createConsumerSession(producerId);
      if (!session) return;

      videoElement._consumerSession = session;
      session.mungeStereoHack = true;

      session.addEventListener("error", (event) => {
        if (videoElement._consumerSession === session) {
          console.error(event.message, event.error);
        }
      });

      session.addEventListener("closed", () => {
        if (videoElement._consumerSession === session) {
          videoElement.pause();
          videoElement.srcObject = null;
          delete videoElement._consumerSession;
        }
      });

      session.addEventListener("streamsChanged", () => {
        if (videoElement._consumerSession === session) {
          const streams = session.streams;
          if (streams.length > 0) {
            videoElement.srcObject = streams[0];
            videoElement.play().catch(() => {});
          }
        }
      });

      session.connect();
    }

    function initRemoteStreams(api) {
      const listener = {
        producerAdded: function (producer) {
          if (counter < 4) {
            producerAddedHandler(api, producer, videoRefs[counter]);
            counter++;
          } else {
            console.log("No more video slots available");
          }
        },
        producerRemoved: function (producer) {
          // Optional: handle stream removal
        },
      };

      api.registerProducersListener(listener);
      for (const producer of api.getAvailableProducers()) {
        listener.producerAdded(producer);
      }
    }

    init();
  }, [videoRefs]);

  return (
    <div className="bg-slate-900 border border-slate-700 h-full">
      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 text-xs">
        <div className="grid grid-cols-4">
          {["CAM1", "CAM2", "CAM3", "FULL"].map((tab) => (
            <TabButton
              key={tab}
              active={activeCameraTab === tab}
              onClick={() => setActiveCameraTab(tab)}
              className="text-center py-2"
            >
              {tab}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Main video display */}
      <div className="p-2">
        {activeCameraTab !== "FULL" && (
          <div className="grid grid-rows-[1fr,auto] gap-1 mb-2 h-full">
            {/* Top row: 1 large video */}
            <div className="bg-black border border-slate-600 aspect-video relative">
              <video
                ref={videoRefs[0]}
                id="video1"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute top-1 left-1 text-xs text-green-400">
                ● CAM{activeCameraTab.slice(3)}
              </div>
            </div>

            {/* Bottom row: 2 videos side by side */}
            <div className="grid grid-cols-2 gap-1">
              {[1, 2].map((_, idx) => {
                const i = idx + 1; // 2nd and 3rd videos
                return (
                  <div
                    key={i + 1}
                    className="bg-black border border-slate-600 aspect-video relative"
                  >
                    <video
                      ref={videoRefs[i]}
                      id={`video${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute top-1 left-1 text-xs text-green-400">
                      ● CAM{(activeCameraTab[3] + i - 1) % 3 + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Fullscreen layout */}
        {activeCameraTab === "FULL" && (
          <div className="grid grid-cols-3 gap-1 mb-2 h-full">
            {/* Left column: 2 small videos stacked */}
            <div className="flex flex-col gap-1 col-span-1">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="bg-black border border-slate-600 aspect-video relative flex-1"
                >
                  <video
                    ref={videoRefs[idx]}
                    id={`video${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute top-1 left-1 text-xs text-green-400">
                    ● CAM{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Right column: 1 large video */}
            <div className="col-span-2 bg-black border border-slate-600 aspect-video relative">
              <video
                ref={videoRefs[2]}
                id="video3"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute top-1 left-1 text-xs text-green-400">
                ● CAM3
              </div>
            </div>
          </div>
        )}


        {/* Camera status info */}
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>EXPOSURE:</span>
            <span className="text-green-400">AUTO</span>
          </div>
          <div className="flex justify-between">
            <span>FOCUS:</span>
            <span className="text-green-400">∞</span>
          </div>
          <div className="flex justify-between">
            <span>NIGHT MODE:</span>
            <span className="text-red-400">OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPanel;
