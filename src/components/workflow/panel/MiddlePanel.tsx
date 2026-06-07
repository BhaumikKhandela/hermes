import { ChevronLeft } from "lucide-react";
import { useState } from "react"
import RightPanel from "./RightPanel";
import { Tabs } from "./Tabs";
import { ExecutionChat } from "./ExecutionChat";

export const MiddlePanel = () => {
    const [activeTab, setActiveTab] = useState("Visual Editor");
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col relative bg-slate-50/30">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "Visual Editor" ? (
                <div className="flex-1 relative bg-[radial-gradient(#e5e7eb_1px, transparent_1px) p-2">
                    <h1>
                        Canvas goes here
                    </h1>
                </div>
            ): (
                <ExecutionChat />
            )}

            {!isRightPanelOpen && (
                <button
                onClick = {() => setIsRightPanelOpen(true)}
                className="absolute right-0 top-14 bg-red-500 text-white rounded-l-md p-1.5">
                    <ChevronLeft size={16} />
                </button>
            )}
            </div>

            <RightPanel 
            isRightPanelOpen={isRightPanelOpen}
            setIsRightPanelOpen={setIsRightPanelOpen}
            />

        </div>
    )
}