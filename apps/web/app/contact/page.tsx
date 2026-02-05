"use client";

import { api } from "@/convex/_generated/api";
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAction } from "convex/react";
import { Building2, ChevronRight, Mail, Newspaper } from 'lucide-react';
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from 'react';

const contactMethods = [
	{
		title: "Customer Support",
		description: "Need help with your account or have questions about our service?",
		email: "support@cribnosh.com",
		icon: <Mail className="w-6 h-6" />,
		color: "from-red-50 to-red-100/50"
	},
	{
		title: "Business Partnerships",
		description: "Interested in partnering with CribNosh?",
		email: "partnerships@cribnosh.com",
		icon: <Building2 className="w-6 h-6" />,
		color: "from-orange-50 to-orange-100/50"
	},
	{
		title: "Press Inquiries",
		description: "Member of the press? Get in touch with our media team.",
		email: "press@cribnosh.com",
		icon: <Newspaper className="w-6 h-6" />,
		color: "from-yellow-50 to-yellow-100/50"
	},
];

export default function Contact() {
	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		subject: 'general',
		message: '',
	});
	const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
	const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
	const isMobile = useMediaQuery('(max-width: 768px)');

	// Convex actions for emails and contacts
	const sendEmail = useAction(api.actions.resend.sendEmail);
	const addContact = useAction(api.actions.resend.addContactToAudience);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus('submitting');
		try {
			// 1. Send email to support via Convex action
			const subjectLine = `[Contact] ${form.subject} from ${form.firstName} ${form.lastName}`;
			await sendEmail({
				to: 'support@cribnosh.com',
				from: 'earlyaccess@emails.cribnosh.com',
				subject: subjectLine,
				html: `<p><strong>Subject:</strong> ${form.subject}</p><p><strong>From:</strong> ${form.firstName} ${form.lastName} (${form.email})</p><p><strong>Message:</strong></p><p>${form.message.replace(/\n/g, '<br>')}</p>`,
			});

			// 2. Add to broadcast list
			await addContact({
				email: form.email,
				firstName: form.firstName,
				lastName: form.lastName,
			});

			setStatus('success');
		} catch (err) {
			console.error('Error submitting contact form:', err);
			setStatus('error');
		}
	};

	const MobileContactMethod = ({ method }: { method: typeof contactMethods[0] }) => (
		<motion.button
			onClick={() => setSelectedMethod(method.email)}
			className="w-full text-left"
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
		>
			<div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
				<div className="flex items-center gap-3">
					<div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}>
						{method.icon}
					</div>
					<div>
						<h3 className="text-base font-bold text-neutral-800">{method.title}</h3>
						<p className="text-sm text-neutral-600 line-clamp-1">{method.description}</p>
					</div>
				</div>
				<ChevronRight className="w-5 h-5 text-neutral-400" />
			</div>
		</motion.button>
	);

	const MobileContactDetails = ({ method }: { method: typeof contactMethods[0] }) => (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-sm"
		>
			<button
				onClick={() => setSelectedMethod(null)}
				className="mb-4 text-sm font-medium text-neutral-600 flex items-center gap-1"
			>
				<ChevronRight className="w-4 h-4 rotate-180" />
				Back to all contacts
			</button>
			<div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4`}>
				{method.icon}
			</div>
			<h3 className="text-xl font-bold text-neutral-800 mb-2">{method.title}</h3>
			<p className="text-neutral-600 mb-4">{method.description}</p>
			<Link
				href={`mailto:${method.email}`}
				className="inline-flex items-center text-[#ff3b30] hover:text-[#ff5e54] font-medium transition-colors"
			>
				{method.email}
			</Link>
		</motion.div>
	);

	return (
		<main>
			<section data-section-theme="light" className="min-h-screen relative py-20 sm:py-32">
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#ff3b3015_0%,transparent_100%)]" />

				<div className="container mx-auto px-4 h-full">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-12 sm:mb-16"
					>
						<h1 className="font-asgard text-4xl sm:text-5xl md:text-6xl font-bold text-[#ff3b30] mb-4 sm:mb-6">
							Get in Touch
							<br />
							<span className="text-neutral-800">We'd Love to Hear from You</span>
						</h1>
						<p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto px-4">
							Having questions about CribNosh? Want to partner with us? We're here to help.
						</p>
					</motion.div>

					{isMobile ? (
						<div className="space-y-6">
							{!selectedMethod ? (
								<>
									<h2 className="font-asgard text-2xl font-bold text-neutral-800 mb-4">
										Contact Methods
									</h2>
									<div className="space-y-3">
										{contactMethods.map((method) => (
											<MobileContactMethod key={method.email} method={method} />
										))}
									</div>
									<div className="mt-8">
										<h2 className="font-asgard text-2xl font-bold text-neutral-800 mb-4">
											Send a Message
										</h2>
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-sm"
										>
											<form onSubmit={handleSubmit} className="space-y-4">
												<div>
													<label htmlFor="firstName" className="block text-sm font-medium text-neutral-600 mb-2">
														First Name
													</label>
													<input
														type="text"
														id="firstName"
														name="firstName"
														className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
														placeholder="John"
														value={form.firstName}
														onChange={handleChange}
													/>
												</div>
												<div>
													<label htmlFor="lastName" className="block text-sm font-medium text-neutral-600 mb-2">
														Last Name
													</label>
													<input
														type="text"
														id="lastName"
														name="lastName"
														className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
														placeholder="Doe"
														value={form.lastName}
														onChange={handleChange}
													/>
												</div>
												<div>
													<label htmlFor="email" className="block text-sm font-medium text-neutral-600 mb-2">
														Email Address
													</label>
													<input
														type="email"
														id="email"
														name="email"
														className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
														placeholder="john@cribnosh.co.uk"
														value={form.email}
														onChange={handleChange}
														required
													/>
												</div>
												<div>
													<label htmlFor="subject" className="block text-sm font-medium text-neutral-600 mb-2">
														Subject
													</label>
													<select
														id="subject"
														name="subject"
														className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
														value={form.subject}
														onChange={handleChange}
													>
														<option value="general">General Inquiry</option>
														<option value="partnership">Partnership Opportunity</option>
														<option value="support">Support</option>
														<option value="other">Other</option>
													</select>
												</div>
												<div>
													<label htmlFor="message" className="block text-sm font-medium text-neutral-600 mb-2">
														Message
													</label>
													<textarea
														id="message"
														name="message"
														rows={4}
														className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
														placeholder="How can we help you?"
														value={form.message}
														onChange={handleChange}
														required
													/>
												</div>
												<motion.button
													type="submit"
													className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff3b30] px-6 py-3 text-base font-semibold text-white hover:bg-[#ff5e54] transition-colors duration-300"
													disabled={status === 'submitting'}
													whileHover={{ scale: 1.02 }}
													whileTap={{ scale: 0.98 }}
												>
													{status === 'submitting' ? 'Sending...' : 'Send Message'}
												</motion.button>
												{status === 'success' && (
													<motion.p
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														className="text-green-600 mt-3 text-center"
													>
														Message sent! We'll be in touch soon.
													</motion.p>
												)}
												{status === 'error' && (
													<motion.p
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														className="text-red-600 mt-3 text-center"
													>
														Failed to send message. Please try again.
													</motion.p>
												)}
											</form>
										</motion.div>
									</div>
								</>
							) : (
								<MobileContactDetails
									method={contactMethods.find(m => m.email === selectedMethod)!}
								/>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
							{/* Desktop Contact Methods */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="space-y-6"
							>
								<h2 className="font-asgard text-2xl sm:text-3xl font-bold text-neutral-800 mb-6">
									Contact Methods
								</h2>
								<div className="grid gap-6">
									{contactMethods.map((method, index) => (
										<motion.div
											key={method.title}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
											className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
										>
											<div className="flex items-start gap-4">
												<div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
													{method.icon}
												</div>
												<div>
													<h3 className="text-lg font-bold text-neutral-800 mb-2">{method.title}</h3>
													<p className="text-neutral-600 mb-3">{method.description}</p>
													<Link
														href={`mailto:${method.email}`}
														className="inline-flex items-center text-[#ff3b30] hover:text-[#ff5e54] font-medium transition-colors"
													>
														{method.email}
													</Link>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							</motion.div>

							{/* Desktop Contact Form */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="bg-white/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-100 shadow-sm"
							>
								<h2 className="font-asgard text-2xl sm:text-3xl font-bold text-neutral-800 mb-6">
									Send Us a Message
								</h2>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div>
											<label htmlFor="firstName" className="block text-sm font-medium text-neutral-600 mb-2">
												First Name
											</label>
											<input
												type="text"
												id="firstName"
												name="firstName"
												className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
												placeholder="John"
												value={form.firstName}
												onChange={handleChange}
											/>
										</div>
										<div>
											<label htmlFor="lastName" className="block text-sm font-medium text-neutral-600 mb-2">
												Last Name
											</label>
											<input
												type="text"
												id="lastName"
												name="lastName"
												className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
												placeholder="Doe"
												value={form.lastName}
												onChange={handleChange}
											/>
										</div>
									</div>

									<div>
										<label htmlFor="email" className="block text-sm font-medium text-neutral-600 mb-2">
											Email Address
										</label>
										<input
											type="email"
											id="email"
											name="email"
											className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
											placeholder="john@cribnosh.co.uk"
											value={form.email}
											onChange={handleChange}
											required
										/>
									</div>

									<div>
										<label htmlFor="subject" className="block text-sm font-medium text-neutral-600 mb-2">
											Subject
										</label>
										<select
											id="subject"
											name="subject"
											className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
											value={form.subject}
											onChange={handleChange}
										>
											<option value="general">General Inquiry</option>
											<option value="partnership">Partnership Opportunity</option>
											<option value="support">Support</option>
											<option value="other">Other</option>
										</select>
									</div>

									<div>
										<label htmlFor="message" className="block text-sm font-medium text-neutral-600 mb-2">
											Message
										</label>
										<textarea
											id="message"
											name="message"
											rows={6}
											className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
											placeholder="How can we help you?"
											value={form.message}
											onChange={handleChange}
											required
										/>
									</div>

									<div>
										<motion.button
											type="submit"
											className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#ff3b30] px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold text-white hover:bg-[#ff5e54] transition-colors duration-300"
											disabled={status === 'submitting'}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
										>
											{status === 'submitting' ? 'Sending...' : 'Send Message'}
										</motion.button>
										{status === 'success' && (
											<motion.p
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className="text-green-600 mt-3"
											>
												Message sent! We'll be in touch soon.
											</motion.p>
										)}
										{status === 'error' && (
											<motion.p
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												className="text-red-600 mt-3"
											>
												Failed to send message. Please try again.
											</motion.p>
										)}
									</div>
								</form>
							</motion.div>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}