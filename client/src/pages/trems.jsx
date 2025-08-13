import React from "react";

const TermsOfService = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p>By using our application, you agree to follow the rules set forth below.</p>

      <ul className="list-disc list-inside mt-4">
        <li>You must comply with Facebook and Instagram’s terms.</li>
        <li>You agree not to misuse our app or access unauthorized data.</li>
        <li>We reserve the right to update these terms at any time.</li>
      </ul>
    </div>
  );
};

export default TermsOfService;
