import Image from "next/image";
import Link from "next/link";


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
                        <h1>ICON</h1>
                    </span>
                </div>
                <div className=" self-center">
                    <nav className=" ">
                        <ul className="flex gap-5">
                            <li className="">
                                <Link href="" className="">Cart
                                </Link>
                            </li>
                            <li className="">
                                <Link href="" className="">Profile
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>

            </div>

               
        </header>
    )
}