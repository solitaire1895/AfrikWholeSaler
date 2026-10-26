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
  PasswordStrength,
} from "@/components/ui/auth-helpers";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";
import { authErrorMessage } from "@/i18n/auth-errors";

// ISO 3166 codes; names are shown in the visitor's language with
// Intl.DisplayNames, and stored in English as before.
const countryGroups: { region: "Africa" | "Europe" | "North America" | "South America" | "Asia" | "Middle East" | "Oceania"; codes: string[] }[] = [
  {
    region: "Africa",
    codes: ["SN", "NG", "CM", "KE", "GH", "CI", "ZA", "EG", "MA", "TZ", "ET", "UG", "DZ", "TN", "MZ", "CD", "RW", "ZM", "ZW", "BW", "MG", "ML", "BF", "BJ", "TG", "GA", "CG", "MU", "NA", "AO", "TD", "NE", "GN", "CF"],
  },
  {
    region: "Europe",
    codes: ["DE", "FR", "GB", "IT", "ES", "NL", "BE", "CH", "PL", "SE", "NO", "DK", "FI", "PT", "AT", "IE", "CZ", "GR", "RO", "HU", "HR", "BG", "SK", "UA", "LT", "LV", "EE"],
  },
  {
    region: "North America",
    codes: ["US", "CA", "MX", "GT", "PA", "CR", "DO", "HN", "JM", "CU", "SV", "TT", "BS", "BB"],
  },
  { region: "South America", codes: ["BR", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY", "GY", "SR"] },
  {
    region: "Asia",
    codes: ["CN", "IN", "VN", "TH", "ID", "MY", "PH", "JP", "KR", "BD", "PK", "LK", "KH", "MM", "TW", "SG", "HK"],
  },
  { region: "Middle East", codes: ["TR", "AE", "SA", "IL", "QA", "KW", "OM", "JO", "LB", "BH"] },
  { region: "Oceania", codes: ["AU", "NZ", "FJ"] },
];

const englishNames = new Intl.DisplayNames(["en"], { type: "region" });

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const R = t.auth.register;
  const E = t.auth.errors;
  const localNames = new Intl.DisplayNames([intlLocale[locale]], { type: "region" });
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
    if (!formData.firstName) newErrors.firstName = E.firstNameRequired;
    if (!formData.lastName) newErrors.lastName = E.lastNameRequired;
    if (!formData.email) newErrors.email = E.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = E.emailInvalid;
    if (!formData.company) newErrors.company = E.companyRequired;
    if (!formData.phone) newErrors.phone = E.phoneRequired;
    if (!formData.country) newErrors.country = E.countryRequired;
    if (!formData.password) newErrors.password = E.passwordRequired;
    else if (formData.password.length < 8) newErrors.password = E.passwordShort;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = E.passwordMismatch;
    if (!agreeToTerms) newErrors.terms = E.termsRequired;
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
          setErrors({ general: authErrorMessage(t, error.message) });
        } else if (data.user) {
          // If email confirmation is required, show a message.
          // If not, redirect to dashboard.
          if (data.session) {
            router.push("/products");
            router.refresh();
          } else {
            // Email confirmation required — redirect to login with notice
            router.push("/login?message=check_email");
          }
        }
      } catch {
        setErrors({ general: E.unexpected });
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
          {R.title}
        </h2>
        <p className="text-sm text-text-secondary">
          {R.lead}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={R.firstName}
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
            label={R.lastName}
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
          label={R.email}
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
          label={R.company}
          type="text"
          name="company"
          placeholder={R.companyPlaceholder}
          icon={<Building className="h-4 w-4" />}
          value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)}
          error={errors.company}
        />

        {/* Phone + Country */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={R.phone}
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
              {R.country}
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
                  {R.selectCountry}
                </option>
                {countryGroups.map((group) => (
                  <optgroup key={group.region} label={R.regions[group.region]}>
                    {group.codes
                      .map((code) => ({ value: englishNames.of(code) ?? code, label: localNames.of(code) ?? code }))
                      .sort((a, b) => a.label.localeCompare(b.label, intlLocale[locale]))
                      .map((c) => (
                        <option key={c.value} value={c.value} className="text-text-primary">
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
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
            label={R.password}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder={R.passwordPlaceholder}
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
              aria-label={R.togglePassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <PasswordStrength password={formData.password} labels={t.auth.strength} />
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            label={R.confirm}
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder={R.confirmPlaceholder}
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
              aria-label={R.toggleConfirm}
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
                {R.agreeBefore}{" "}
                <Link href="/terms" className="font-medium text-brand hover:text-brand-hover">
                  {R.terms}
                </Link>{" "}
                {R.agreeAnd}{" "}
                <Link href="/privacy" className="font-medium text-brand hover:text-brand-hover">
                  {R.privacy}
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
              {R.creating}
            </>
          ) : (
            <>
              {R.create}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        {R.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-brand hover:text-brand-hover transition-colors"
        >
          {R.signIn}
        </Link>
      </p>
    </div>
  );
}