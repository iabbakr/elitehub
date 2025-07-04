import Link from "next/link";
import { FaXTwitter, FaLocationDot, FaPhone, FaInstagram, FaWhatsapp, FaTiktok, FaFacebookF } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { CgMail } from "react-icons/cg";
import { BiLogoGmail } from "react-icons/bi";




export default function Footer() {
    return (
        <footer className="border text-center flex flex-col gap-10">
            <div className="flex justify-between">

                <div className=" border justify-start">
                    <Link href="">
                        <FaXTwitter />
                        <FaLocationDot />

                    </Link>
                    <Link href="">
                        <FaInstagram />
                        <FaPhone />


                    </Link>
                    <Link href="">
                        <FaWhatsapp />
                        <CgMail />

                    </Link>
                    <Link href="">
                        <FaTiktok />
                        <BiLogoGmail />

                    </Link>
                    <Link href="">
                        <FaFacebookF />
                    </Link>
                    
                </div>
                <div className="border">
                    <p>twitter</p>
                    <p>facebook <FaSearch /></p>
                    <p>whatsapp</p>
                    
                </div>
                <div className="border ">
                    <p>Warrant/Return Policy</p>
                    <p>Terms and condition</p>
                </div>
            </div>
            <div className="">
                <p>&copy; {new Date().getFullYear()} Elitehub. All rights reserved.</p>

            </div>
        </footer>
    )
}