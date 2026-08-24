export default defineConfig({
  base: '/cyber_attack_detection/',
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
