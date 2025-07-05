import Link from "next/link";
import { FaXTwitter, FaLocationDot, FaPhone, FaInstagram, FaWhatsapp, FaTiktok, FaFacebookF } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { CgMail } from "react-icons/cg";
import { BiLogoGmail } from "react-icons/bi";




export default function Footer() {
    return (
        <footer className="border text-center flex flex-col gap-10">
            <div className="flex justify-between flex-col md:flex-row">

                <div className=" border ">
                    <Link href="">
                        <FaXTwitter className="text-2xl"/>
                        <FaLocationDot className="text-2xl"/>

                    </Link>
                    <Link href="">
                        <FaInstagram className="text-2xl"/>
                        


                    </Link>
                    <Link href="">
                        
                        <CgMail className="text-2xl"/>

                    </Link>
                    <Link href="">
                        <FaTiktok className="text-2xl"/>
                        <BiLogoGmail className="text-2xl"/>

                    </Link>
                    <Link href="">
                        <FaFacebookF className="text-2xl"/>
                    </Link>
                    
                </div>
                <div className="border">
                    <p>twitter</p>
                    <p>facebook </p>
                    <p>whatsapp</p>
                    
                </div>
                <div className="border te">
                    <p>Warrant/Return Policy</p>
                    <p>Terms and condition</p>
                    <FaPhone className="text-2xl"/>
                    <FaWhatsapp className="text-2xl"/>
                </div>
            </div>
            <div className="bg---brand2">
                <p>&copy; {new Date().getFullYear()} Elitehub. All rights reserved.</p>

            </div>
        </footer>
    )
}