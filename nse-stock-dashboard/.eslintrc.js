module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Disable no-explicit-any warning since we use any in some API responses
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
