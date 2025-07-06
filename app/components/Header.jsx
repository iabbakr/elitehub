import Image from "next/image";
import Link from "next/link";
import { FaOpencart, FaRegUser, FaSearchengin } from "react-icons/fa6";



export default function Header() {
    return (
        <header className="">
            <div className="flex justify-between m-3 md:flex">
                <div className="">
                    <Link href="/home">
                        <Image 
                        src="/images/PNG/Logo.png"
                        alt="EliteHub Logo"
                        width={100}
                        height={100}
                        className=""
                    />
                    </Link>
                </div>
                <div className="self-center flex hidden md:flex w-130">
                    <input 
                    type="search" 
                    aria-label="search-box"
                    name="search"
                    placeholder="what are you looking for?"
                    className="border rounded-l-full border-r-0 pl-5 h-10 w-full"
                    />
                    <span className="border rounded-r-full w-20 ">
                        <span><FaSearchengin className="text-4xl pl-3 "/></span>
                    </span>
                </div>
                <div className=" self-center">
                    <nav className=" ">
                        <ul className="flex gap-5">
                            <li className="">
                                <Link href="" className=""><FaOpencart className="text-29235c-500 text-2xl"/>
                                </Link>
                            </li>
                            <li className="">
                                <Link href="" className=""><FaRegUser className="text-[#e7302a]-900 text-2xl hover:"/>


                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>

            </div>

               
        </header>
    )
}