import { ArrowRight } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export const SharedKitchenIntro = () => {
  const router = useRouter();

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: [0.48, 0.15, 0.25, 0.96]
      }
    })
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" data-section-theme="light">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('/backgrounds/masonry-2.jpg')] opacity-5 bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/85 to-[#ff3b30]/5   " />

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4 px-6 py-2 rounded-full bg-gradient-to-r from-[#ff3b30]/10 to-[#ff5e54]/10  "
            >
              <span className="font-satoshi font-medium bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] bg-clip-text text-transparent">
                Introducing Shared Kitchen
              </span>
            </motion.div>

            <h2 className="font-asgard text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] bg-clip-text text-transparent">
              No Kitchen?
              <br />
              No Problem!
            </h2>

            <p className="font-satoshi text-xl md:text-2xl text-gray-700  max-w-3xl mx-auto">
              Where Culinary Dreams Meet Reality - Connect with kitchen owners and create magic together
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Card - For Food Creators */}
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className="relative group lg:card-tilt"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/80  rounded-3xl p-8 md:p-10 shadow-xl border border-[#ff3b30]/20 flex flex-col items-start gap-4">
                <motion.div className="relative mb-2 h-20 w-20 overflow-hidden rounded-2xl">
                  <Image
                    src="/kitchenillus.png"
                    alt="Space illustrative"
                    fill
                    className="object-cover"
                  />
                </motion.div>
                <h3 className="font-asgard text-3xl text-[#ff3b30]  mb-2">
                  I Need a Space
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Access our network of certified shared kitchens and commercial spaces tailored for food creations.
                </p>
                <button
                  onClick={() => router.push('/become-a-food-creator/apply?type=food-creator')}
                  className="inline-flex items-center gap-2 text-[#ff3b30] font-bold group"
                  aria-label="Apply as a food creator"
                >
                  Apply as Food Creator
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>

            {/* Right Card - For Kitchen Owners */}
            <motion.div
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className="relative group lg:card-tilt"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff5e54] to-[#ff3b30] rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/80  rounded-3xl p-8 md:p-10 shadow-xl border border-[#ff5e54]/20 flex flex-col items-start gap-4">
                <motion.div className="relative mb-2 h-20 w-20 overflow-hidden rounded-2xl">
                  <Image
                    src="/backgrounds/masonry-1.jpg"
                    alt="Kitchen space"
                    fill
                    className="object-cover"
                  />
                </motion.div>
                <h3 className="font-asgard text-3xl text-[#ff5e54]  mb-2">
                  I Have a Space
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Turn your kitchen's downtime into revenue by hosting verified local food creators.
                </p>
                <button
                  onClick={() => router.push('/become-a-food-creator/apply?type=kitchen-owner')}
                  className="inline-flex items-center gap-2 text-[#ff5e54] font-bold group"
                  aria-label="List your kitchen"
                >
                  List Your Kitchen
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center space-x-2 font-satoshi text-gray-600 ">
              <svg className="w-5 h-5 text-[#ff3b30]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All kitchens verified for safety and compliance</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SharedKitchenIntro;