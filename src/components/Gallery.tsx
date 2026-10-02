import { useEffect, useState } from 'react';
import { galleryCategories, galleryItems } from '@/data/gallery';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function Gallery() {
  const [filter, setFilter] = useState('Todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allCategories = ['Todos', ...galleryCategories];

  const items =
    filter === 'Todos'
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);


  const currentItem =
    lightboxIndex !== null ? items[lightboxIndex] : null;


  useEffect(() => {
    setLightboxIndex(null);
  }, [filter]);


  const showPrevious = () => {
    setLightboxIndex((index) =>
      index === null
        ? null
        : (index - 1 + items.length) % items.length
    );
  };


  const showNext = () => {
    setLightboxIndex((index) =>
      index === null
        ? null
        : (index + 1) % items.length
    );
  };


  return (
    <section
      id="galeria"
      className="bg-ink-50 py-20 sm:py-28"
    >

      <div className="mx-auto max-w-7xl px-4 sm:px-6">


        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <span className="section-eyebrow">
              Portafolio
            </span>

            <h2 className="section-title mt-4">
              Proyectos que hablan por nosotros
            </h2>
          </div>


          <p className="max-w-md text-sm leading-6 text-ink-500 sm:text-right">
            Una selección de ambientes transformados con precisión,
            materiales premium y una mirada arquitectónica.
          </p>

        </div>



        <div className="mt-8 flex flex-wrap gap-2">

          {allCategories.map((category) => (

            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`
                rounded-full 
                px-4 
                py-2 
                text-xs 
                font-semibold 
                transition-all
                ${
                  filter === category
                  ? 'bg-ink-900 text-white shadow-lg shadow-ink-900/20'
                  : 'bg-white text-ink-500 ring-1 ring-ink-100 hover:bg-sky-50 hover:text-sky-700'
                }
              `}
            >
              {category}
            </button>

          ))}

        </div>




        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">


          {items.map((item,index)=>(

            <button
              key={item.id}
              onClick={()=>setLightboxIndex(index)}
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                shadow-md
                ring-1
                ring-ink-100
                h-64
              "
            >

              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                onError={(e)=>{
                  e.currentTarget.style.display='none';
                }}
                className="
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-700
                  group-hover:scale-105
                "
              />


              <div className="
                absolute 
                inset-0 
                bg-gradient-to-t 
                from-ink-950/75 
                via-transparent 
                to-transparent
              "/>


              <div className="absolute bottom-0 left-0 p-4 text-left">

                <span className="text-xs text-white/70">
                  {item.category}
                </span>


                <p className="mt-1 font-display text-sm font-bold text-white">
                  {item.title}
                </p>

              </div>


            </button>


          ))}


        </div>


      </div>




      {currentItem && (

        <div
          className="
          fixed
          inset-0
          z-[70]
          flex
          items-center
          justify-center
          bg-ink-950/90
          p-4
          backdrop-blur-md
          "
          onClick={()=>setLightboxIndex(null)}
        >


          <div
            className="
            relative
            flex
            w-full
            max-w-5xl
            items-center
            gap-3
            "
            onClick={(e)=>e.stopPropagation()}
          >



            <button
              onClick={showPrevious}
              className="
              hidden
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              hover:bg-white/20
              sm:flex
              "
            >
              <ArrowLeft className="h-5 w-5"/>
            </button>



            <div className="min-w-0 flex-1">


              <img
                src={currentItem.src}
                alt={currentItem.title}
                className="
                max-h-[78vh]
                w-full
                rounded-3xl
                object-contain
                "
              />


              <div className="mt-4 text-white">

                <span className="text-xs text-white/60">
                  {currentItem.category}
                </span>


                <p className="font-display text-xl font-bold">
                  {currentItem.title}
                </p>


              </div>


            </div>





            <button
              onClick={showNext}
              className="
              hidden
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-white
              hover:bg-white/20
              sm:flex
              "
            >

              <ArrowRight className="h-5 w-5"/>

            </button>





            <button
              onClick={()=>setLightboxIndex(null)}
              className="
              absolute
              -right-1
              -top-12
              rounded-full
              bg-white/10
              p-2
              text-white
              hover:bg-white/20
              "
            >

              <X className="h-5 w-5"/>

            </button>



          </div>


        </div>


      )}



    </section>
  );
}