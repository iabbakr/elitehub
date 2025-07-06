import Link from "next/link";
import { FaXTwitter, FaLocationDot, FaPhone, FaInstagram, FaWhatsapp, FaTiktok, FaFacebookF } from "react-icons/fa6";
import { CgMail } from "react-icons/cg";
import { BiLogoGmail } from "react-icons/bi";




export default function Footer() {


    return (
        <footer className="text-center flex flex-col gap-10 bg-[grey]">
            <div className="flex justify-between gap-5 flex-col md:flex-row mx-15 mt-5 ">

                <div className=" flex gap-5 justify-center">
                    <Link href="">
                        <FaXTwitter className="text-2xl"/>

                    </Link>
                    <Link href="">
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
                        

                    </Link>
                    <Link href="">
                        <BiLogoGmail className="text-2xl"/>

                    </Link>
                    <Link href="">
                        <FaFacebookF className="text-2xl"/>
                    </Link>
                    
                </div>
                <div className="">
                    <p>twitter</p>
                    <p>facebook </p>
                    <p>whatsapp</p>
                    
                </div>
                <div className=" flex gap-10">
                    <p>Warrant/Return Policy</p>
                    <p>Terms and condition</p>
                    <FaPhone className="text-2xl"/>
                    <FaWhatsapp className="text-2xl"/>
                </div>
            </div>
            <div className="bg-[#e7302a] pt-10">
                <p>&copy; {new Date().getFullYear()} Elitehub. All rights reserved.</p>

            </div>
        </footer>
    )
}