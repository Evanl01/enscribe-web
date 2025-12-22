import React from "react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <main>
      <style>{`
        body { font-family: Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 0; }
        .privacy-container { max-width: 900px; margin: 20px auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1976d2; }
        .back-btn { background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .back-btn:hover { background: #1565c0; }
        h1 { color: #1976d2; margin: 0; font-size: 28px; }
        h2 { color: #333; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #1976d2; padding-left: 15px; }
        h3 { color: #555; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
        p, li { line-height: 1.6; color: #444; margin-bottom: 10px; }
        ul { padding-left: 20px; }
        .highlight-box { background: #e3f2fd; border: 1px solid #1976d2; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .contact-info { background: #f5f5f5; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .last-updated { font-style: italic; color: #666; margin-bottom: 30px; }
        .important { color: #d32f2f; font-weight: bold; }
        .section { margin-bottom: 25px; }
      `}</style>
      
      <div className="privacy-container">
        <div className="header">
          <h1>Privacy Policy</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        
        <p className="last-updated">Last Updated: August 10, 2025</p>
        
        <div className="highlight-box">
          <p><strong>EnScribe</strong> is committed to protecting the privacy and security of patient health information. This Privacy Policy explains how we collect, use, protect, and disclose information in compliance with HIPAA and other applicable privacy laws.</p>
        </div>

        <div className="section">
          <h2>1. Information We Collect</h2>
          
          <h3>Protected Health Information (PHI)</h3>
          <p>As a healthcare technology service, EnScribe processes the following types of protected health information:</p>
          <ul>
            <li><strong>Audio recordings</strong> of patient-provider consultations and medical visits</li>
            <li><strong>Transcribed medical conversations</strong> containing patient health information</li>
            <li><strong>Generated SOAP notes</strong> including subjective, objective, assessment, and plan data</li>
            <li><strong>Patient identifiers</strong> that may be mentioned in recordings (names, dates, medical record numbers)</li>
            <li><strong>Medical history and symptoms</strong> discussed during patient visits</li>
            <li><strong>Treatment plans and medications</strong> referenced in transcriptions</li>
          </ul>

          <h3>User Account Information</h3>
          <ul>
            <li>Healthcare provider email addresses and account credentials</li>
            <li>Practice or organization information</li>
            <li>Usage analytics and system logs</li>
            <li>Billing and subscription information</li>
          </ul>
        </div>

        <div className="section">
          <h2>2. How We Use Information</h2>
          <p>EnScribe uses collected information solely for the following purposes:</p>
          <ul>
            <li><strong>Transcription Services:</strong> Converting audio recordings into accurate text transcriptions</li>
            <li><strong>SOAP Note Generation:</strong> Creating structured medical documentation from transcribed content</li>
            <li><strong>Service Improvement:</strong> Enhancing transcription accuracy and system performance</li>
            <li><strong>Technical Support:</strong> Providing customer service and troubleshooting</li>
            <li><strong>Security Monitoring:</strong> Detecting and preventing unauthorized access</li>
            <li><strong>Legal Compliance:</strong> Meeting regulatory requirements and responding to legal requests</li>
          </ul>
        </div>

        <div className="section">
          <h2>3. HIPAA Compliance</h2>
          <div className="highlight-box">
            <p className="important">Enscribe operates as a Business Associate under HIPAA and maintains strict compliance with all applicable regulations.</p>
          </div>
          
          <h3>Security Safeguards</h3>
          <ul>
            <li><strong>Encryption:</strong> All PHI is encrypted both in transit and at rest using industry-standard AES-256 encryption</li>
            <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access restrictions</li>
            <li><strong>Audit Logging:</strong> Comprehensive logging of all system access and PHI handling</li>
            <li><strong>Staff Training:</strong> Regular HIPAA compliance training for all personnel</li>
            <li><strong>Risk Assessments:</strong> Ongoing security evaluations and vulnerability testing</li>
          </ul>

          <h3>Minimum Necessary Standard</h3>
          <p>We limit access to PHI to the minimum amount necessary to accomplish the intended purpose, ensuring that only authorized personnel can access patient information relevant to their specific job functions.</p>
        </div>

        <div className="section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>Enscribe does <strong>NOT</strong> sell, rent, or share PHI with third parties except in the following limited circumstances:</p>
          
          <ul>
            <li><strong>Healthcare Providers:</strong> Returning processed transcriptions and SOAP notes to the originating healthcare provider</li>
            <li><strong>Business Associates:</strong> Sharing with vetted third-party services that assist in our operations (all covered by HIPAA Business Associate Agreements)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory authority</li>
            <li><strong>Emergency Situations:</strong> To prevent serious harm to patient safety when legally permitted</li>
          </ul>

          <p>Any third-party service providers we work with must sign comprehensive Business Associate Agreements and meet the same security standards we maintain.</p>
        </div>

        <div className="section">
          <h2>5. Data Retention and Deletion</h2>
          <ul>
            <li><strong>Audio Recordings:</strong> Securely deleted within 30 days after transcription completion unless otherwise specified by the healthcare provider</li>
            <li><strong>Transcriptions and SOAP Notes:</strong> Retained according to the healthcare provider's specified retention policy, typically 7-10 years</li>
            <li><strong>System Logs:</strong> Maintained for 12 months for security and audit purposes</li>
            <li><strong>Account Information:</strong> Deleted within 90 days of account closure</li>
          </ul>
        </div>

        <div className="section">
          <h2>6. Your Rights</h2>
          <p>As a patient whose information may be processed through Enscribe, you have the following rights:</p>
          
          <ul>
            <li><strong>Access:</strong> Request access to your PHI that we process</li>
            <li><strong>Amendment:</strong> Request correction of inaccurate PHI</li>
            <li><strong>Restriction:</strong> Request limitations on how your PHI is used</li>
            <li><strong>Accounting:</strong> Receive an accounting of PHI disclosures</li>
            <li><strong>Complaint:</strong> File complaints about our privacy practices</li>
          </ul>
          
          <p><em>Note: These rights must typically be exercised through your healthcare provider, as they are the covered entity responsible for your medical records.</em></p>
        </div>

        <div className="section">
          <h2>7. Secure and encrypted patient data</h2>
          <p>All PHI is processed and stored within our SHA-256 compliant database, including audio files, transcripts of patient encounters and SOAP notes. We follow HIPAA guidelines to ensure the confidentiality and security of information at all parts of the website.</p>
        </div>

        <div className="section">
          <h2>8. Breach Notification</h2>
          <p>In the unlikely event of a data breach involving PHI, Enscribe will:</p>
          <ul>
            <li>Notify affected healthcare providers within 24 hours of discovery</li>
            <li>Assist healthcare providers in patient notification as required by law</li>
            <li>Report the breach to the Department of Health and Human Services as required</li>
            <li>Take immediate steps to mitigate harm and prevent future breaches</li>
          </ul>
        </div>

        <div className="section">
          <h2>10. Updates to This Policy</h2>
          <p>We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. All healthcare provider clients will be notified of material changes at least 30 days in advance.</p>
        </div>

        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>For questions about this Privacy Policy or to exercise your rights, please contact:</p>
          <ul>
            <li><strong>Phone:</strong> 213-551-5106</li>
            <li><strong>Email:</strong> loohsienrong@gmail.com</li>
          </ul>
          <p>You may also file complaints with the U.S. Department of Health and Human Services Office for Civil Rights if you believe your privacy rights have been violated.</p>
        </div>

        <div className="highlight-box">
          <p><strong>Notice:</strong> This Privacy Policy applies specifically to Enscribe's processing of health information. Your healthcare provider may have additional privacy policies governing your medical records and care.</p>
        </div>
      </div>
    </main>
  );
}
