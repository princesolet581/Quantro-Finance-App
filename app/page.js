import HeroSection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />

      {/* Stats Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white rounded-xl p-6 hover:scale-105 transform transition duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="text-4xl font-bold text-blue-600">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm mt-2 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Take Control of Your Finances — All in One Place
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuresData.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-2xl p-6 transform hover:-translate-y-1 transition duration-300"
              >
                <CardContent className="space-y-4 pt-4">
                  <div className="text-blue-600 text-3xl">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            How Quantro Works for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {howItWorksData.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center hover:scale-105 transform transition duration-300 shadow-sm hover:shadow-xl"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6 bg-blue-100 text-blue-600 text-2xl">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800">
            Why People Choose Quantro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            {testimonialsData.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-2xl border border-gray-200 transform hover:-translate-y-1 transition"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-gray-800">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of users who are already managing their finances smarter with Quantro
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-full animate-bounce shadow-lg hover:shadow-2xl transition duration-300"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
