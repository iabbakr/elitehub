export default function Footer() {
    return (
        <footer className="border text-center flex flex-col gap-10">
            <div className="flex justify-between">

                <div className=" border justify-start">
                    <p>twitter</p>
                    <p>facebook</p>
                    <p>whatsapp</p>
                </div>
                <div className="border">
                    <p>twitter</p>
                    <p>facebook</p>
                    <p>whatsapp</p>
                </div>
                <div className="border ">
                    <p>twitter</p>
                    <p>facebook</p>
                    <p>whatsapp</p>
                </div>
            </div>
            <div className="">
                <p>&copy; {new Date().getFullYear()} Elitehub. All rights reserved.</p>

            </div>
        </footer>
    )
}