// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     './pages/**/*.{js,ts,jsx,tsx}',
//     './components/**/*.{js,ts,jsx,tsx}',

//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: '#F9113A',
//       },
//       fontFamily: {
//         sans: ['Inter', 'system-ui', 'sans-serif'],
//       },
//       animation: {
//         'slide-in': 'slideIn 0.3s ease-out',
//         'fade-in': 'fadeIn 0.5s ease-out',
//         'pulse-slow': 'pulse 3s infinite',
//         'spin': 'spin 1s linear infinite',
//       },
//     },
//   },
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF2FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        }
      },
    },
  },
  plugins: [],
}