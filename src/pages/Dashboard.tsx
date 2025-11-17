import { ProgressAuto } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { VscDebugDisconnect } from "react-icons/vsc";

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center ">
                <div className="w-[400px]">
                    <ProgressAuto
                        durationMs={500}
                        startDelayMs={10}
                        className="h-1 rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[80vh] w-full flex flex-col justify-center items-center">
            <VscDebugDisconnect size={200} className="text-maintx mb-10" />

            <h1 className="text-lg font-medium text-gray-600">
                <span className="text-maintx">(Посещаемость) - </span> Временно недоступно
            </h1>
        </div>
    );
};

export default Dashboard;
