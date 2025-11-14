/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './src/**/*.{js,jsx,ts,tsx}', // React bileşenlerinizi tarar
    ],
    prefix: "",
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "var(--border)",
          input: "var(--input)",
          ring: "rgb(var(--ring))",
          background: "rgb(var(--background))",
          foreground: "rgb(var(--foreground))",
          primary: {
            DEFAULT: "rgb(var(--primary))",
            foreground: "rgb(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "rgb(var(--secondary))",
            foreground: "rgb(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "rgb(var(--destructive))",
            foreground: "rgb(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "rgb(var(--muted))",
            foreground: "rgb(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "rgb(var(--accent))",
            foreground: "rgb(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "rgb(var(--popover))",
            foreground: "rgb(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "rgb(var(--card))",
            foreground: "rgb(var(--card-foreground))",
          },
        },
        opacity: {
          '5': '0.05',
          '10': '0.10',
          '20': '0.20',
          '30': '0.30',
          '40': '0.40',
          '50': '0.50',
          '60': '0.60',
          '80': '0.80',
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")], // Bu eklenti için 'npm install tailwindcss-animate' yapmanız gerekecek
  }