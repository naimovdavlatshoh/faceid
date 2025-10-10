import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    HiLocationMarker,
    HiMail,
    HiBriefcase,
    HiAcademicCap,
    HiPhotograph,
    HiVideoCamera,
} from "react-icons/hi";
import {
    IoHeartOutline,
    IoChatbubbleOutline,
    IoShareOutline,
} from "react-icons/io5";

const Details = () => {
    return (
        <div className="min-h-screen ">
            {/* Header with Banner */}
            <div className="relative rounded-3xl bg-white pb-5 shadow-lg">
                {/* Banner */}
                <div className="h-64 bg-gradient-to-r from-mainbg via-dark-blue-600 to-light-blue-600 relative overflow-hidden rounded-t-3xl">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30"></div>
                </div>

                {/* Profile Section */}
                <div className="relative -mt-16 px-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Profile Image and Basic Info */}
                        <div className="flex flex-col items-center lg:items-start">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-mainbg to-dark-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white dark:border-gray-800">
                                JF
                            </div>
                            <div className="text-center lg:text-left mt-4">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Jaydon Frankie
                                </h1>
                                <p className="text-gray-600 dark:text-gray-300">
                                    CTO
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className=" py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats */}
                        <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-50  rounded-2xl">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            1,947
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Followers
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            9,124
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Following
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* About Section */}
                        <Card className="bg-white dark:bg-gray-800 shadow-lg border border-gray-50 rounded-2xl">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    About
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                                    Tart I love sugar plum I love oat cake.
                                    Sweet roll caramels I love jujubes. Topping
                                    cake wafer..
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <HiLocationMarker className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Live at United Kingdom
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HiMail className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            ashlynn.ohara62@gmail.com
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HiBriefcase className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            CTO at Gleichner, Mueller and Tromp
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <HiAcademicCap className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Studied at Nikolaus - Leuschke
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Posts */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create Post */}
                        <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mainbg to-dark-blue-500 flex items-center justify-center text-white font-semibold">
                                        JF
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            placeholder="Share what you are thinking here..."
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-mainbg bg-transparent text-gray-900 dark:text-white placeholder-gray-500"
                                            rows={3}
                                        />
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 dark:text-gray-400"
                                                >
                                                    <HiPhotograph className="w-4 h-4 mr-2" />
                                                    Image/Video
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 dark:text-gray-400"
                                                >
                                                    <HiVideoCamera className="w-4 h-4 mr-2" />
                                                    Streaming
                                                </Button>
                                            </div>
                                            <Button className="bg-mainbg hover:bg-mainbg/90 text-white rounded-xl">
                                                Post
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sample Post */}
                        <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mainbg to-dark-blue-500 flex items-center justify-center text-white font-semibold">
                                        JF
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            Jaydon Frankie
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            28 Sep 2025
                                        </p>
                                    </div>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                    The sun slowly set over the horizon,
                                    painting the sky in vibrant hues of orange
                                    and pink.
                                </p>

                                {/* Post Image */}
                                <div className="rounded-xl overflow-hidden mb-4">
                                    <div className="h-48 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="text-4xl mb-2">
                                                🏔️
                                            </div>
                                            <p className="text-sm opacity-90">
                                                Mountain landscape with city
                                                lights reflection
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 dark:text-gray-400 hover:text-red-500"
                                    >
                                        <IoHeartOutline className="w-4 h-4 mr-2" />
                                        Like
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 dark:text-gray-400"
                                    >
                                        <IoChatbubbleOutline className="w-4 h-4 mr-2" />
                                        Comment
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 dark:text-gray-400"
                                    >
                                        <IoShareOutline className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Details;
