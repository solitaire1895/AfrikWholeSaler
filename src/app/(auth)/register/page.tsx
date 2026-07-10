"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Building,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Divider,
  SocialButton,
  PasswordStrength,
} from "@/components/ui/auth-helpers";
import { createClient } from "@/lib/supabase/client";

const africanCountries = [
  "Nigeria",
  "Kenya",
  "Cameroon",
  "Senegal",
  "Ghana",
  "South Africa",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Ivory Coast",
  "Ethiopia",
  "Zambia",
  "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.company) newErrors.company = "Company name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.country) newErrors.country = "Please select your country";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!agreeToTerms) newErrors.terms = "You must agree to the terms to continue";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              company: formData.company,
              phone: formData.phone,
              country: formData.country,
            },
          },
        });

        if (error) {
          setErrors({ general: error.message });
        } else if (data.user) {
          // If email confirmation is required, show a message.
          // If not, redirect to dashboard.
          if (data.session) {
            router.push("/dashboard");
            router.refresh();
          } else {
            // Email confirmation required — redirect to login with notice
            router.push("/login?message=check_email");
          }
        }
      } catch {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy tracking-tight mb-2">
          Create your account
        </h2>
        <p className="text-sm text-text-secondary">
          Start sourcing quality products from China with confidence
        </p>
      </div>

      {/* Social Signup */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <SocialButton provider="google" />
        <SocialButton provider="apple" />
      </div>

      <Divider label="or sign up with email" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            name="firstName"
            placeholder="John"
            icon={<User className="h-4 w-4" />}
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            type="text"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <Input
          label="Business email"
          type="email"
          name="email"
          placeholder="you@company.com"
          icon={<Mail className="h-4 w-4" />}
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        {/* Company */}
        <Input
          label="Company name"
          type="text"
          name="company"
          placeholder="Your Business Ltd"
          icon={<Building className="h-4 w-4" />}
          value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)}
          error={errors.company}
        />

        {/* Phone + Country */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone number"
            type="tel"
            name="phone"
            placeholder="+237 6XX XXX XXX"
            icon={<Phone className="h-4 w-4" />}
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
            autoComplete="tel"
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled pointer-events-none" />
              <select
                name="country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className={`w-full h-12 rounded-[var(--radius-input)] border bg-surface pl-11 pr-4 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 ${
                  errors.country
                    ? "border-error focus:border-error focus:ring-error/20"
                    : "border-border focus:border-brand focus:ring-brand/20"
                } ${!formData.country && "text-text-disabled"}`}
              >
                <option value="" disabled>
                  Select country
                </option>
                {africanCountries.map((country) => (
                  <option key={country} value={country} className="text-text-primary">
                    {country}
                  </option>
                ))}
              </select>
            </div>
            {errors.country && (
              <p className="mt-1.5 text-xs text-error font-medium">
                {errors.country}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create a strong password"
            icon={<Lock className="h-4 w-4" />}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          {formData.password && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[34px] text-text-disabled hover:text-text-secondary transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <PasswordStrength password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Re-enter your password"
            icon={<Lock className="h-4 w-4" />}
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          {formData.confirmPassword && (
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-[34px] text-text-disabled hover:text-text-secondary transition-colors"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Terms */}
        <div>
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onChange={setAgreeToTerms}
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-brand hover:text-brand-hover">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-brand hover:text-brand-hover">
                  Privacy Policy
                </Link>
              </>
            }
          />
          {errors.terms && (
            <p className="mt-1.5 text-xs text-error font-medium ml-7">
              {errors.terms}
            </p>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="rounded-[var(--radius-md)] border border-error/20 bg-error/5 p-3 text-sm text-error">
            {errors.general}
          </div>
        )}

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}