/** RidePact design tokens — pulled from wireframes.html :root variables.
 *  Identical token set is used by admin-web's Tailwind config. */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#F5F5F0',
        white: '#FFFFFF',
        primary: { DEFAULT: '#3AAFA9', light: '#E8F6F5', dark: '#2B8A85' },
        accent: { DEFAULT: '#FF6B6B', light: '#FFF0F0' },
        maize: { DEFAULT: '#F5C842', light: '#FFF8E1' },
        text: { DEFAULT: '#1A1A2E', 2: '#4A4A5A', 3: '#8A8A9A' },
        border: '#E8E8E8',
        sidebar: '#1A1A2E',
      },
      borderRadius: {
        card: '14px',
        btn: '12px',
      },
    },
  },
  plugins: [],
};
