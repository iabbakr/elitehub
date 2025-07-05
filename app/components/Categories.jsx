

export default function categories({data}){
    return (
        <section className=" ">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 text-center my-20 ">
                {data.map((item) => (
                    <div className="categories" key={item.key}>
                    <span className="text-8xl border ">{item.emoji}</span>
                    <p>{item.name}</p>
                </div>

                ))}
                
                
            </div>
        </section>
    )
}