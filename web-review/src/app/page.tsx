"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Star,
  MapPin,
  Music,
  Heart,
  ArrowRight,
  Download,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage(data.message);
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Failed to send message");
      }
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-white">MOTIVZ</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/review">
              <Button
                variant="ghost"
                className="text-white hover:text-purple-300"
              >
                Leave Review
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6">
            Find Your <span className="text-purple-400">MOTIVZ</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover amazing events, connect with friends, and find the perfect
            night out. The ultimate social app for nightlife and entertainment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4"
            >
              <Download className="w-5 h-5 mr-2" />
              Download App
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white px-8 py-4"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose MOTIVZ?
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need for the perfect night out
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Discover Events</CardTitle>
              <CardDescription className="text-gray-300">
                Find the hottest events happening around you with real-time
                updates and trending highlights.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Connect with Friends</CardTitle>
              <CardDescription className="text-gray-300">
                See which events your friends are attending and discover new
                connections in your area.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Live Reviews</CardTitle>
              <CardDescription className="text-gray-300">
                Get real-time reviews and ratings from other users to make
                informed decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Venue Information</CardTitle>
              <CardDescription className="text-gray-300">
                Access detailed venue information, hours, music schedules, and
                contact details.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Music Genres</CardTitle>
              <CardDescription className="text-gray-300">
                Filter events by your favorite music genres and discover new
                sounds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">
                Personalized Experience
              </CardTitle>
              <CardDescription className="text-gray-300">
                Get personalized recommendations based on your preferences and
                friend activity.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            See MOTIVZ in Action
          </h2>
          <p className="text-xl text-gray-300">
            Experience the app before you download
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Interactive Demo
            </h3>
            <p className="text-gray-300 mb-6">
              Try out the key features of MOTIVZ right in your browser. Explore
              events, see how the social features work, and get a feel for the
              app experience.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-white">Browse trending events</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-white">Connect with friends</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-white">Leave reviews and ratings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-white">Filter by music genre</span>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/review">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Try Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">
                        Friday Night Vibes
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Club XYZ • 9:00 PM
                      </p>
                    </div>
                    <Badge className="bg-orange-500 text-white">
                      🔥 Trending
                    </Badge>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">
                        Saturday Sessions
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Venue ABC • 10:00 PM
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      3 friends going
                    </Badge>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">
                        Sunday Funday
                      </h4>
                      <p className="text-gray-400 text-sm">Bar 123 • 8:00 PM</p>
                    </div>
                    <Badge className="bg-blue-500 text-white">4.8★</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-xl text-gray-300">
            Have questions? We&apos;d love to hear from you
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
              <CardDescription className="text-gray-300">
                Send us a message and we&apos;ll get back to you as soon as
                possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {submitStatus === "success" && (
                  <div className="p-3 bg-green-900 border border-green-700 rounded-lg">
                    <p className="text-green-300 text-sm">{submitMessage}</p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                    <p className="text-red-300 text-sm">{submitMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-white">MOTIVZ</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/review" className="text-gray-300 hover:text-white">
              Leave Review
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
            <a href="#" className="text-gray-300 hover:text-white">
              Privacy
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              Terms
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2024 MOTIVZ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
