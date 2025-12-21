import { Handshake, Lock, MapPin, Sparkles, TrendingUp } from 'lucide-react';
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
            {/* Left Card - For Chefs */}
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/80  rounded-3xl p-8 md:p-10 shadow-xl border border-[#ff3b30]/20 ">
                <div className="mb-6">
                  <Image
                    src="/kitchenillus.png"
                    alt="Chef looking for kitchen"
                    width={80}
                    height={80}
                    className="rounded-2xl"
                  />
                </div>
                <h3 className="font-asgard text-3xl text-[#ff3b30]  mb-4">
                  Got Skills, Need Space?
                </h3>
                <ul className="font-satoshi space-y-4 text-gray-600  mb-8">
                  <li className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-3 text-gray-900" />
                    Access fully-equipped professional kitchens
                  </li>
                  <li className="flex items-center">
                    <Handshake className="w-5 h-5 mr-3 text-gray-900" />
                    Partner with verified kitchen owners
                  </li>
                  <li className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-gray-900" />
                    Find spaces in your neighborhood
                  </li>
                </ul>
                <button
                  onClick={() => router.push('/cooking/apply?type=chef')}
                  className="w-full font-satoshi px-6 py-3 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-xl shadow-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:ring-offset-2"
                  aria-label="Apply as a chef"
                >
                  Apply as Chef
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
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff5e54] to-[#ff3b30] rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative backdrop-blur-sm bg-white/80  rounded-3xl p-8 md:p-10 shadow-xl border border-[#ff5e54]/20 ">
                <div className="mb-6">
                  <Image
                    src="/backgrounds/masonry-1.jpg"
                    alt="Kitchen space"
                    width={80}
                    height={80}
                    className="rounded-2xl"
                  />
                </div>
                <h3 className="font-asgard text-3xl text-[#ff5e54]  mb-4">
                  Got Kitchen, Need Chef?
                </h3>
                <ul className="font-satoshi space-y-4 text-gray-600  mb-8">
                  <li className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-3 text-gray-900" />
                    Monetize your unused kitchen time
                  </li>
                  <li className="flex items-center">
                    <Lock className="w-5 h-5 mr-3 text-gray-900" />
                    Connect with verified, skilled chefs
                  </li>
                  <li className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-3 text-gray-900" />
                    Grow your culinary community
                  </li>
                </ul>
                <button
                  onClick={() => router.push('/cooking/apply?type=kitchen-owner')}
                  className="w-full font-satoshi px-6 py-3 bg-gradient-to-r from-[#ff5e54] to-[#ff3b30] text-white rounded-xl shadow-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#ff5e54] focus:ring-offset-2"
                  aria-label="List your kitchen"
                >
                  List Your Kitchen
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