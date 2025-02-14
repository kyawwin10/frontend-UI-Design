import { useState } from "react";
import { CircleUserRound, Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { GroundingFiles } from "@/components/ui/grounding-files";
import GroundingFileView from "@/components/ui/grounding-file-view";
import StatusMessage from "@/components/ui/status-message";

import useRealTime from "@/hooks/useRealtime";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useAudioPlayer from "@/hooks/useAudioPlayer";

import { ConversationAddTextCommand, GroundingFile, ToolResult } from "./types";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { motion } from "framer-motion";
// import { useLocation } from "react-router-dom";


function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [groundingFiles, setGroundingFiles] = useState<GroundingFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GroundingFile | null>(null);
    // const location = useLocation();
    const [active, setActive] = useState("Home");

    const { startSession, addUserAudio, inputAudioBufferClear, sendJsonMessage } = useRealTime({
        onWebSocketOpen: () => console.log("WebSocket connection opened"),
        onWebSocketClose: () => console.log("WebSocket connection closed"),
        onWebSocketError: event => console.error("WebSocket error:", event),
        onReceivedError: message => console.error("error", message),
        onReceivedResponseAudioDelta: message => {
            isRecording && playAudio(message.delta);
        },
        onReceivedInputAudioBufferSpeechStarted: () => {
            stopAudioPlayer();
        },
        onReceivedExtensionMiddleTierToolResponse: message => {
            const result: ToolResult = JSON.parse(message.tool_result);
            const files: GroundingFile[] = result.sources.map(x => ({ id: x.chunk_id, name: x.title, content: x.chunk }));
            setGroundingFiles(prev => [...prev, ...files]);
        }
    });

    const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();
    const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({ onAudioRecorded: addUserAudio });

    const onToggleListening = async () => {
        if (!isRecording) {
            startSession();
            setIsRecording(true);
            await startAudioRecording();
            resetAudioPlayer();
        } else {
            setIsRecording(false);
            console.log("clicking3");
            await stopAudioRecording();
            stopAudioPlayer();
            inputAudioBufferClear();
        }
    };

    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col text-gray-900 animate-bgChange">
            <div className="flex justify-between m-4 text-gray-900">
                <div>
                    <img src='/fusion-logo.png' alt="fusion logo" className="h-16 w-16" />
                </div>
                <ul className="flex flex-row space-x-6 text-lg font-semibold mt-2">
                    <li onClick={() => setActive("Home")} className={`${active === "Home" ? "text-blue-600" : "text-violet-500"}`}>
                        Home
                    </li>
                    <li onClick={() => setActive("About")} className={`${active === "About" ? "text-blue-600" : "text-violet-500"}`}>
                        About
                    </li>
                    <li onClick={() => setActive("Contact")} className={`${active === "Contact" ? "text-blue-600" : "text-violet-500"}`}>
                        Contact Us
                    </li>
                </ul>

                <div>
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger><CircleUserRound /><span className="ml-2">Profile</span></NavigationMenuTrigger>
                                <NavigationMenuContent>

                                    <ul className="w-28">
                                        <li className="p-2 hover:bg-gray-200 rounded-lg">Sign In</li>
                                        <li className="p-2 hover:bg-gray-200 rounded-lg">Gmail Acc</li>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                </div>
            </div>

            <main className="flex flex-grow flex-col items-center justify-center px-6 text-center">
                {/* Text Reveal Animation */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 10,
                        ease: "easeOut",
                        repeat: Infinity, // Loops forever
                    }}
                    className="mb-8 text-4xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
                    {t("app.title")}
                </motion.h1>
                <div className="mb-4 flex flex-col items-center justify-center">
                    <Button
                        onClick={onToggleListening}
                        className={`group relative h-12 w-60 md:h-16 md:w-64 lg:h-18 lg:w-80 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl ${isRecording
                            ? "bg-gradient-to-r from-red-500 from-10% via-orange-500 via-30% to-pink-500 to-90% bg-[length:400%] hover:animate-gradient-xy hover:bg-[length:100%] shadow-[0px_0px_30px_6px_rgba(0,212,255,0.7)]"
                            : "bg-gradient-to-r from-violet-500 from-10% via-sky-500 via-30% to-pink-500 to-90% bg-[length:400%] hover:animate-gradient-xy hover:bg-[length:100%] shadow-red-500/40"
                            }`}
                        aria-label={isRecording ? t("app.stopRecording") : t("app.startRecording")}
                    >
                        {isRecording ? (
                            <>
                                <MicOff className="mr-2 h-4 w-4" />
                                {t("app.stopConversation")}
                            </>
                        ) : (
                            <>
                                <Mic className="mr-2 h-6 w-6" />
                                {t("app.startRecording")}
                            </>
                        )}
                    </Button>

                    <StatusMessage isRecording={isRecording} />
                </div>
                <GroundingFiles files={groundingFiles} onSelected={setSelectedFile} />
            </main>

            <footer className="py-6 text-center">
                <p className="text-gray-600 text-sm md:text-md font-medium tracking-wide">
                    {t("app.footer")}
                </p>
            </footer>

            <GroundingFileView groundingFile={selectedFile} onClosed={() => setSelectedFile(null)} />
        </div>
    );
}

export default App;