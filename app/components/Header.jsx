import Image from "next/image";
import Link from "next/link";
import { FaOpencart, FaRegUser, FaSearchengin } from "react-icons/fa6";



export default function Header() {
    return (
        <header className="">
            <div className="flex justify-between border m-3">
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
                <div className="self-center flex">
                    <input 
                    type="search" 
                    aria-label="search-box"
                    name="search"
                    placeholder="what are you looking for?"
                    className="border rounded-l-full border-r-0"
                    />
                    <span className="border rounded-r-full b">
                        <span><FaSearchengin /></span>
                    </span>
                </div>
                <div className=" self-center">
                    <nav className=" ">
                        <ul className="flex gap-5">
                            <li className="">
                                <Link href="" className=""><FaOpencart className="text-29235c-500 text-2xl"/>
Cart
                                </Link>
                            </li>
                            <li className="">
                                <Link href="" className="">Profile <FaRegUser className="text-brand2-900 text-2xl hover:"/>


                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>

            </div>

               
        </header>
    )
}