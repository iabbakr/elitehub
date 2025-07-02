import Image from "next/image";


export default function header() {
    return (
        <header className="bg-gray border h-20 w-full">
            <Image 
                src={"./images/PNG/Logo.png"}
                alt="EliteHub Logo"
                width={100}
                height={100}
                className="h-16 w-16"
            />
            <h1 className="text-2xl font-bold">EliteHub</h1>
        </header>
    )
}