import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { HiEye, HiEyeOff } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { PostData } from "@/services/data";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [statusbtn, setStatusbtn] = useState(false);

    const handleSubmit = () => {
        setStatusbtn(true);
        const payload = {
            login: login,
            password: password,
        };

        PostData("login", payload)
            .then((response) => {
                if (response?.data?.jwt) {
                    localStorage.setItem("token", response?.data?.jwt);
                    localStorage.setItem("object", response?.data?.object_id);
                    localStorage.setItem(
                        "objects",
                        JSON.stringify(response?.data?.all_objects)
                    );
                    toast.success("Успешный вход!", {
                        description: "Добро пожаловать в систему",
                        duration: 3000,
                    });
                    setStatusbtn(false);
                    if (localStorage.getItem("token")) {
                        navigate("/");
                        setTimeout(() => {
                            window.location.reload();
                        }, 50);
                    }
                }
            })
            .catch((error) => {
                toast.error("Ошибка входа", {
                    description: error?.response?.data?.message,
                    duration: 3000,
                });
            });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex">
            {/* Left Side - Welcome Section */}
            <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-mainbg/5 to-dark-blue-500/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 py-16">
                    {/* Welcome Content */}
                    <div className="max-w-md">
                        <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
                            Привет, Добро пожаловать
                        </h1>

                        {/* 3D Illustration Placeholder */}
                        <div className="relative">
                            <div className="text-center">
                                <img src="/login-img.png" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/3 flex flex-col justify-center px-8 py-16">
                <div className="max-w-md mx-auto w-full">
                    {/* Login Form */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Войти в аккаунт
                            </h2>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start space-x-3">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">
                                    i
                                </span>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Введите логин и пароль
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="text"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Логин
                                </Label>
                                <Input
                                    id="text"
                                    type="text"
                                    placeholder="demo@admin.com"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    className="h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-mainbg focus:border-mainbg transition-all duration-200"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Пароль
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-mainbg focus:border-mainbg transition-all duration-200 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <HiEyeOff className="h-5 w-5" />
                                        ) : (
                                            <HiEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) =>
                                        setRememberMe(checked as boolean)
                                    }
                                    className="data-[state=checked]:bg-mainbg data-[state=checked]:border-mainbg"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                                >
                                    Запомнить меня
                                </Label>
                            </div>

                            {/* Login Button */}
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    login.length <= 2 || password.length <= 2
                                }
                                className="w-full h-12 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-all duration-200"
                            >
                                {statusbtn ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Войти"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
