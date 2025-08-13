import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p>This Privacy Policy explains how we collect, use, and protect your personal data when you use our application.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
      <ul className="list-disc list-inside">
        <li>Your Facebook public profile (name, email, profile picture)</li>
        <li>Facebook Pages and connected Instagram accounts (with your permission)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Data</h2>
      <p>We use this information only to connect your social accounts for the intended features. We do not sell or share your data with third parties.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>If you have any questions, contact us at <a href="mailto:support@socialapp" className="text-blue-600 underline">support@socialapp</a>.</p>
    </div>
  );
};

export default PrivacyPolicy;
