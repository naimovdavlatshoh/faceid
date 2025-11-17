import { ProgressAuto } from "@/components/ui/progress";
import { useEffect, useState } from "react";

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
        <div className="h-[80vh] w-full flex justify-center items-center">
            <h1 className="text-2xl font-medium text-gray-600"> Временно недоступно</h1>
        </div>
    );
};

export default Dashboard;
