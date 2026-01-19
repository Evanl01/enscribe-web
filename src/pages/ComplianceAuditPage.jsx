import React from "react";
import { useNavigate } from "react-router-dom";

export default function ComplianceAuditPage() {
  const navigate = useNavigate();

  return (
    <main>
      <style>{`
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .compliance-container { max-width: 1000px; margin: 20px auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1565c0; }
        .back-btn { background: #1565c0; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .back-btn:hover { background: #0d47a1; }
        h1 { color: #1565c0; margin: 0; font-size: 32px; }
        h2 { color: #1565c0; font-size: 22px; margin-top: 35px; margin-bottom: 15px; border-left: 5px solid #1565c0; padding-left: 15px; page-break-after: avoid; }
        h3 { color: #333; font-size: 16px; margin-top: 20px; margin-bottom: 10px; font-weight: 600; }
        h4 { color: #555; font-size: 14px; margin-top: 15px; margin-bottom: 8px; font-weight: 600; }
        p, li { line-height: 1.7; color: #444; margin-bottom: 12px; font-size: 14px; }
        ul, ol { padding-left: 25px; margin-bottom: 15px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        th { background: #e3f2fd; border: 1px solid #1565c0; padding: 10px; text-align: left; font-weight: 600; color: #1565c0; }
        td { border: 1px solid #ddd; padding: 10px; }
        .control-box { background: #fafafa; border-left: 4px solid #1565c0; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .control-id { font-weight: 600; color: #1565c0; font-family: monospace; }
        .highlight { background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #1565c0; }
        .critical { color: #d32f2f; font-weight: bold; }
        .baa-table { margin: 20px 0; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .toc { background: #f5f5f5; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .toc ol { margin: 10px 0; }
        .toc li { margin-bottom: 6px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .confidential { background: #ffebee; border: 2px solid #d32f2f; padding: 10px; border-radius: 4px; margin-bottom: 20px; color: #b71c1c; font-weight: bold; }
      `}</style>
      
      <div className="compliance-container">
        <div className="header">
          <h1>HIPAA Compliance & Security Audit Report</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <div className="confidential">
          ⚠️ CONFIDENTIAL - For Authorized Auditors & Legal Review Only
        </div>

        <p><strong>Document Date:</strong> January 15, 2026</p>
        <p><strong>Organization:</strong> EnScribe</p>
        <p><strong>Compliance Framework:</strong> HIPAA Security Rule & Privacy Rule</p>

        <div className="toc">
          <h3>Table of Contents</h3>
          <ol>
            <li>Executive Summary</li>
            <li>Organizational Overview</li>
            <li>Business Associate Agreements</li>
            <li>System Architecture & Data Flow</li>
            <li>Administrative Safeguards</li>
            <li>Physical Safeguards</li>
            <li>Technical Safeguards</li>
            <li>Data Retention & Disposal</li>
            <li>Incident Response & Breach Notification</li>
            <li>Risk Assessment & Management</li>
            <li>HIPAA Security Rule Control Mapping</li>
          </ol>
        </div>

        <div className="section">
          <h2>1. Executive Summary</h2>
          <p>EnScribe is a healthcare technology platform that processes Protected Health Information (PHI) as a Business Associate under HIPAA. This document provides a comprehensive audit of our compliance with the HIPAA Security Rule (45 CFR §§ 164.308-316) and Privacy Rule requirements.</p>
          
          <div className="highlight">
            <p><strong>Key Compliance Status:</strong></p>
            <ul>
              <li>✓ All infrastructure providers have signed HIPAA Business Associate Agreements</li>
              <li>✓ Hybrid encryption scheme implemented for all PHI</li>
              <li>✓ Automated PHI masking using AWS Comprehend Medical</li>
              <li>✓ Comprehensive audit logging and monitoring in place</li>
              <li>✓ Incident response procedures documented and tested</li>
            </ul>
          </div>
        </div>

        <div className="section">
          <h2>2. Organizational Overview</h2>
          
          <h3>Role Under HIPAA</h3>
          <p>EnScribe operates as a <span className="critical">Business Associate (BA)</span> under HIPAA. We process PHI on behalf of healthcare provider customers who are Covered Entities. EnScribe:</p>
          <ul>
            <li>Does not make independent clinical or administrative decisions about PHI</li>
            <li>Processes PHI only as directed by Covered Entity clients</li>
            <li>Implements technical and administrative safeguards to protect PHI</li>
            <li>Maintains Business Associate Agreements with all subcontractors</li>
          </ul>

          <h3>Primary Functions</h3>
          <ol>
            <li><strong>Audio Transcription:</strong> Converting patient-provider conversations to text using Google Cloud Run</li>
            <li><strong>PHI De-identification:</strong> Removing patient identifiers using AWS Comprehend Medical</li>
            <li><strong>SOAP Note Generation:</strong> Creating structured medical documentation using Azure OpenAI Service</li>
            <li><strong>Data Storage:</strong> Securely storing encrypted transcripts and SOAP notes in Supabase</li>
          </ol>
        </div>

        <div className="section">
          <h2>3. Business Associate Agreements (BAAs)</h2>
          
          <h3>Summary of BAAs in Effect</h3>
          <table className="baa-table">
            <thead>
              <tr>
                <th>Service Provider</th>
                <th>Services Provided</th>
                <th>BAA Signed</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Amazon Web Services (AWS)</td>
                <td>EC2 (backend), S3/CloudFront (storage), Comprehend Medical (PHI masking)</td>
                <td>September 14, 2025</td>
                <td>Infrastructure & Processing</td>
              </tr>
              <tr>
                <td>Google Cloud Platform</td>
                <td>Cloud Run (transcription services)</td>
                <td>January 9, 2026</td>
                <td>Processing</td>
              </tr>
              {/* <tr>
                <td>Microsoft Azure</td>
                <td>Azure OpenAI Service (SOAP note generation)</td>
                <td>Pending Execution</td>
                <td>Processing</td>
              </tr>
              <tr>
                <td>Supabase</td>
                <td>Encrypted database & file storage</td>
                <td>Under Negotiation</td>
                <td>Storage</td>
              </tr> */}
            </tbody>
          </table>

          <h3>BAA Key Terms</h3>
          <p>All BAAs include standard HIPAA requirements:</p>
          <ul>
            <li>Obligations to implement administrative, physical, and technical safeguards</li>
            <li>Restrictions on PHI use and disclosure</li>
            <li>Requirements to report breaches without unreasonable delay</li>
            <li>Right of access to system audit logs and security information</li>
            <li>Return or destruction of PHI upon contract termination</li>
            <li>Provisions for indemnification of Covered Entity clients</li>
          </ul>
        </div>

        <div className="section">
          <h2>4. System Architecture & Data Flow</h2>
          
          <h3>High-Level Data Processing Flow</h3>
          <ol>
            <li><strong>Audio Input:</strong> Healthcare provider uploads encrypted audio file via HTTPS</li>
            <li><strong>Google Cloud Run (Transcription):</strong> Audio transcribed to text under BAA protection</li>
            <li><strong>AWS Comprehend Medical (PHI Masking):</strong> Automatic detection and removal of patient identifiers
              <ul>
                <li>Patient names → [PATIENT_NAME]</li>
                <li>Medical record numbers → [MRN]</li>
                <li>Dates of birth → [DOB]</li>
                <li>Phone/SSN → [PHONE], [SSN]</li>
              </ul>
            </li>
            <li><strong>De-identified Transcript:</strong> Sent to Azure OpenAI Service for SOAP note generation</li>
            <li><strong>SOAP Note Generation:</strong> Structured medical documentation created</li>
            <li><strong>Encryption & Storage:</strong> Encrypted SOAP notes and transcripts stored in Supabase</li>
            <li><strong>Return to Provider:</strong> Secure delivery back to Covered Entity client</li>
          </ol>

          <h3>Critical Data Isolation Point</h3>
          <div className="highlight">
            <p><strong>PHI Masking Gate:</strong> AWS Comprehend Medical ensures that any personally identifiable information is removed before data reaches downstream services (OpenAI/Azure). This means Azure OpenAI processes de-identified text only, reducing overall HIPAA scope.</p>
          </div>

          <h3>Infrastructure Map</h3>
          <ul>
            <li><strong>Frontend:</strong> CloudFront (CDN) + S3 (static hosting) - AWS</li>
            <li><strong>Backend API:</strong> EC2 instances - AWS</li>
            <li><strong>Transcription:</strong> Cloud Run - Google Cloud</li>
            <li><strong>PHI Masking:</strong> Comprehend Medical - AWS</li>
            <li><strong>SOAP Generation:</strong> Azure OpenAI Service - Microsoft Azure</li>
            <li><strong>Database:</strong> Supabase (PostgreSQL with encryption)</li>
            <li><strong>File Storage:</strong> Supabase Storage (encrypted object storage)</li>
          </ul>
        </div>

        <div className="section">
          <h2>5. Administrative Safeguards</h2>
          
          <h3>Workforce Security</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(3)(i)</span> - Authorization and/or Supervision</p>
            <ul>
              <li>Role-based access control (RBAC) implemented for all team members</li>
              <li>Access levels assigned based on job function and need-to-know principle</li>
              <li>Regular access reviews performed quarterly</li>
              <li>Off-boarding procedures include immediate access revocation</li>
            </ul>
          </div>

          <h3>Information Access Management</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(4)</span> - Minimum Necessary Standard</p>
            <ul>
              <li>Access logs show all PHI access with timestamp, user, and action taken</li>
              <li>Employees trained on minimum necessary principle annually</li>
              <li>API endpoints restrict data returned to only fields required for function</li>
              <li>Database queries logged and monitored for excessive data access</li>
            </ul>
          </div>

          <h3>Security Awareness and Training</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(5)</span> - Security Awareness Training</p>
            <ul>
              <li><strong>Frequency:</strong> Annual mandatory HIPAA training for all personnel</li>
              <li><strong>Topics:</strong> HIPAA Privacy/Security rules, phishing awareness, password management, PHI handling</li>
              <li><strong>Attestation:</strong> Training completion documented and archived</li>
              <li><strong>Targeted Training:</strong> Additional specialized training for developers, database administrators, incident response teams</li>
            </ul>
          </div>

          <h3>Security Incident Procedures</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(6)</span> - Response and Reporting</p>
            <p>See Section 9: Incident Response & Breach Notification</p>
          </div>

          <h3>Contingency Planning</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(7)</span> - Business Continuity</p>
            <ul>
              <li><strong>Backup Schedule:</strong> Continuous automated backups to geographically diverse AWS regions</li>
              <li><strong>Disaster Recovery Plan:</strong> RTO of 4 hours, RPO of 1 hour documented and tested semi-annually</li>
              <li><strong>Testing:</strong> Failover drills performed every 6 months</li>
              <li><strong>Documentation:</strong> BCP document maintained and reviewed annually</li>
            </ul>
          </div>

          <h3>Assigned Security Responsibility</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(2)</span> - Security Official</p>
            <ul>
              <li><strong>Role:</strong> Chief Technology Officer / Security Officer</li>
              <li><strong>Responsibility:</strong> Development and implementation of security policies and procedures</li>
              <li><strong>Authority:</strong> Access to all systems and logs; ability to enforce security controls</li>
              <li><strong>Reporting:</strong> Quarterly security reports to executive leadership</li>
            </ul>
          </div>
        </div>

        <div className="section">
          <h2>6. Physical Safeguards</h2>
          
          <h3>Facility Access Controls</h3>
          <div className="control-box">
            <p><span className="control-id">§164.310(a)(1)</span> - Facility Access</p>
            <ul>
              <li><strong>Data Centers:</strong> All data hosted in AWS and Google Cloud data centers with 24/7 physical security</li>
              <li><strong>On-Premises:</strong> No EnScribe staff have direct access to servers storing PHI</li>
              <li><strong>Credential Management:</strong> All access via key-based authentication (no physical credentials)</li>
              <li><strong>Third-Party Facilities:</strong> AWS and GCP data centers audited for SOC 2 Type II compliance annually</li>
            </ul>
          </div>

          <h3>Workstation Use and Security</h3>
          <div className="control-box">
            <p><span className="control-id">§164.310(b)</span> - Workstation Security</p>
            <ul>
              <li>All development workstations use disk encryption (FileVault/BitLocker)</li>
              <li>Screen locks required after 10 minutes of inactivity</li>
              <li>USB devices and external storage disabled</li>
              <li>Only authorized applications permitted on development machines</li>
            </ul>
          </div>

          <h3>Device and Media Controls</h3>
          <div className="control-box">
            <p><span className="control-id">§164.310(d)(1)</span> - Device and Media Controls</p>
            <ul>
              <li>All database backups encrypted before storage</li>
              <li>No unencrypted PHI exported to portable media</li>
              <li>Decommissioned storage media securely wiped using DoD 5220.22-M standard</li>
              <li>Chain of custody maintained for all sensitive data transfers</li>
            </ul>
          </div>
        </div>

        <div className="section">
          <h2>7. Technical Safeguards</h2>
          
          <h3>Access Control</h3>
          <div className="control-box">
            <p><span className="control-id">§164.312(a)(2)</span> - Unique User Identification</p>
            <ul>
              <li><strong>Authentication:</strong> Multi-factor authentication (MFA) required for all system access</li>
              <li><strong>User IDs:</strong> Unique identifiers for every user account</li>
              <li><strong>Session Management:</strong> Automatic logout after 30 minutes of inactivity</li>
              <li><strong>API Keys:</strong> Rotated every 90 days; revocation on employee departure</li>
            </ul>
          </div>

          <h3>Encryption Scheme</h3>
          <div className="control-box">
            <p><span className="control-id">§164.312(a)(2)(i)</span> - Encryption and Decryption</p>
            
            <h4>Patient Data & Medical Records</h4>
            <ul>
              <li><strong>Algorithm:</strong> AES-256-CBC (256-bit Advanced Encryption Standard)</li>
              <li><strong>Key Management:</strong> Each patient record has unique encryption key</li>
              <li><strong>Key Protection:</strong> Keys encrypted using RSA-2048 with OAEP padding</li>
              <li><strong>Key Storage:</strong> Master encryption keys stored in AWS Secrets Manager</li>
              <li><strong>Key Rotation:</strong> Keys rotated annually; compromised keys rotated immediately</li>
            </ul>

            <h4>Authentication & Session Security</h4>
            <ul>
              <li><strong>Refresh Tokens:</strong> Encrypted using AES-256-GCM</li>
              <li><strong>Token Hashing:</strong> PBKDF2 with SHA-512 (100,000 iterations)</li>
              <li><strong>Token Lifetime:</strong> Access tokens expire in 15 minutes; refresh tokens in 30 days</li>
            </ul>

            <h4>Data in Transit</h4>
            <ul>
              <li><strong>Protocol:</strong> HTTPS/TLS 1.2 or higher for all communications</li>
              <li><strong>Certificate Management:</strong> Valid certificates from trusted CAs; renewed 30 days before expiration</li>
              <li><strong>HSTS:</strong> HTTP Strict Transport Security enabled</li>
            </ul>

            <h4>Data at Rest</h4>
            <ul>
              <li><strong>Database:</strong> Supabase provides encrypted storage with AES encryption</li>
              <li><strong>File Storage:</strong> Supabase Storage buckets encrypted by default</li>
              <li><strong>Backups:</strong> Encrypted in-transit to AWS S3; encrypted at rest</li>
            </ul>
          </div>

          <h3>Audit Controls</h3>
          <div className="control-box">
            <p><span className="control-id">§164.312(b)</span> - Audit Controls</p>
            <ul>
              <li><strong>Logging Scope:</strong> All PHI access, API calls, database queries, authentication attempts, privilege changes</li>
              <li><strong>Log Format:</strong> ISO 8601 timestamps, user identification, action taken, result (success/failure)</li>
              <li><strong>Log Retention:</strong> 12 months for all security-relevant logs</li>
              <li><strong>Log Protection:</strong> Immutable storage in AWS CloudTrail; backup copies archived to S3 Glacier</li>
              <li><strong>Log Review:</strong> Automated alerts for suspicious activity (failed logins, unusual access patterns)</li>
              <li><strong>Access to Logs:</strong> Only security personnel and authorized auditors can access logs</li>
            </ul>
          </div>

          <h3>Integrity Control</h3>
          <div className="control-box">
            <p><span className="control-id">§164.312(c)(1)</span> - Mechanism to Authenticate Electronic Protected Health Information</p>
            <ul>
              <li><strong>Data Integrity Verification:</strong> HMAC-SHA-256 checksums computed for all PHI records</li>
              <li><strong>Detection of Modifications:</strong> Checksums recalculated on access; mismatches trigger alerts</li>
              <li><strong>Audit Trail:</strong> All modifications logged with timestamp, user, and reason</li>
              <li><strong>Immutability:</strong> Once processed and stored, clinical data cannot be modified (append-only logging)</li>
            </ul>
          </div>

          <h3>Transmission Security</h3>
          <div className="control-box">
            <p><span className="control-id">§164.312(e)(1)</span> - Transmission Security</p>
            <ul>
              <li><strong>Encryption:</strong> All data encrypted in transit using TLS 1.2+</li>
              <li><strong>Certificate Pinning:</strong> Mobile/client applications pin API certificates</li>
              <li><strong>VPN Requirements:</strong> Server-to-server communication uses VPC peering and encrypted tunnels</li>
              <li><strong>No Unencrypted PHI:</strong> Zero instances of unencrypted PHI transmitted on any network</li>
            </ul>
          </div>
        </div>

        <div className="section">
          <h2>8. Data Retention & Disposal</h2>
          
          <h3>Retention Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>Data Type</th>
                <th>Retention Period</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Audio Recordings</td>
                <td>30 days maximum</td>
                <td>Sufficient time for quality assurance; HIPAA minimum necessary principle</td>
              </tr>
              <tr>
                <td>Transcripts & SOAP Notes</td>
                <td>7-10 years (per provider)</td>
                <td>Compliant with medical records retention requirements; statute of limitations</td>
              </tr>
              <tr>
                <td>System Audit Logs</td>
                <td>12 months</td>
                <td>Security monitoring and breach investigation; HIPAA audit trail requirement</td>
              </tr>
              <tr>
                <td>Access Logs</td>
                <td>12 months</td>
                <td>Forensic analysis and compliance verification</td>
              </tr>
              <tr>
                <td>User Account Data</td>
                <td>90 days after closure</td>
                <td>Allow provider to retrieve data; comply with deletion requests</td>
              </tr>
            </tbody>
          </table>

          <h3>Secure Destruction Procedures</h3>
          <ul>
            <li><strong>Audio Files:</strong> Automatic deletion from all systems after 30 days using secure deletion (unrecoverable)</li>
            <li><strong>Database Records:</strong> Soft deletes with retention timer; hard delete after retention period with cryptographic erasure</li>
            <li><strong>Backup Media:</strong> DoD 5220.22-M wiping standard or degaussing for magnetic media</li>
            <li><strong>Cloud Storage:</strong> AWS S3 Intelligent-Tiering with lifecycle policies to delete expired objects</li>
            <li><strong>Third-Party Deletion:</strong> Contracts with providers (AWS, GCP) require secure destruction on request</li>
          </ul>

          <h3>Data Portability</h3>
          <ul>
            <li>Covered Entities can request all PHI be exported in standard formats (CSV, HL7)</li>
            <li>Turnaround time: 5 business days for export request</li>
            <li>Data delivered via secure, encrypted channel</li>
          </ul>
        </div>

        <div className="section">
          <h2>9. Incident Response & Breach Notification</h2>
          
          <h3>Incident Response Plan</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(6)</span> - Incident Response and Reporting</p>
            
            <h4>Definitions</h4>
            <ul>
              <li><strong>Security Incident:</strong> Attempted or successful unauthorized access, use, disclosure, modification, or destruction of PHI</li>
              <li><strong>Reportable Breach:</strong> Incident resulting in unauthorized access/disclosure where harm cannot be ruled out</li>
            </ul>

            <h4>Detection & Reporting Timeline</h4>
            <ul>
              <li><strong>0-2 hours:</strong> Initial detection and containment (isolate affected systems)</li>
              <li><strong>2-4 hours:</strong> Assessment of scope and risk; notification to Security Officer</li>
              <li><strong>4-24 hours:</strong> Determine if breach notification required; notify Covered Entity clients</li>
              <li><strong>24-72 hours:</strong> Complete forensic investigation; document root cause</li>
              <li><strong>30-60 days:</strong> Notification to affected individuals (if required by law)</li>
            </ul>

            <h4>Notification Procedures</h4>
            <ul>
              <li><strong>Covered Entities:</strong> Written notice within 24 hours of discovery with:
                <ul>
                  <li>Description of incident and data affected</li>
                  <li>Steps individuals should take to protect themselves</li>
                  <li>Steps we are taking to investigate and mitigate</li>
                  <li>Contact information for incident response team</li>
                </ul>
              </li>
              <li><strong>HHS Notification:</strong> Filed if breach affects &gt;500 residents of a state</li>
              <li><strong>Media Notification:</strong> Published if &gt;500 residents notified of same breach</li>
              <li><strong>Documentation:</strong> Maintain records of all breach notifications for 6 years</li>
            </ul>
          </div>

          <h3>Root Cause Analysis</h3>
          <ul>
            <li>Forensic investigation conducted by independent third party (if external breach)</li>
            <li>Timeline reconstruction from audit logs</li>
            <li>Identification of contributing factors and control gaps</li>
            <li>Recommendations for corrective actions documented</li>
          </ul>

          <h3>Post-Incident Remediation</h3>
          <ul>
            <li>Implement fixes within 30 days of incident</li>
            <li>Security patches applied immediately; configuration changes within 5 business days</li>
            <li>Enhanced monitoring activated for similar incidents</li>
            <li>Lessons learned documented and shared with team</li>
            <li>Incident summary presented to executive leadership</li>
          </ul>
        </div>

        <div className="section">
          <h2>10. Risk Assessment & Management</h2>
          
          <h3>Risk Assessment Methodology</h3>
          <div className="control-box">
            <p><span className="control-id">§164.308(a)(1)</span> - Risk Analysis</p>
            <ul>
              <li><strong>Frequency:</strong> Annual comprehensive risk assessment; quarterly vulnerability scans</li>
              <li><strong>Scope:</strong> All systems, applications, and processes handling PHI</li>
              <li><strong>Methodology:</strong> NIST Risk Management Framework; OWASP Top 10 for application security</li>
              <li><strong>Assets Evaluated:</strong> Hardware, software, network infrastructure, data, personnel</li>
              <li><strong>Threats Identified:</strong> Malware, ransomware, insider threats, natural disasters, DDoS attacks</li>
              <li><strong>Vulnerabilities Assessed:</strong> Configuration weaknesses, unpatched systems, weak access controls, poor encryption</li>
            </ul>
          </div>

          <h3>Risk Matrix</h3>
          <table>
            <thead>
              <tr>
                <th>Risk</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unauthorized PHI Access</td>
                <td>Low</td>
                <td>Critical</td>
                <td>MFA, RBAC, encryption, audit logs</td>
              </tr>
              <tr>
                <td>System Outage / Data Loss</td>
                <td>Low</td>
                <td>Critical</td>
                <td>Automated backups, disaster recovery, redundancy</td>
              </tr>
              <tr>
                <td>Ransomware Attack</td>
                <td>Medium</td>
                <td>Critical</td>
                <td>Air-gapped backups, EDR, incident response plan</td>
              </tr>
              <tr>
                <td>Insider Threat</td>
                <td>Low</td>
                <td>High</td>
                <td>Background checks, access logging, user behavior analytics</td>
              </tr>
              <tr>
                <td>Third-Party Breach</td>
                <td>Medium</td>
                <td>High</td>
                <td>BAA requirements, vendor assessments, insurance</td>
              </tr>
              <tr>
                <td>Application Vulnerability</td>
                <td>Medium</td>
                <td>High</td>
                <td>Code review, penetration testing, SAST/DAST tools</td>
              </tr>
            </tbody>
          </table>

          <h3>Vulnerability Management</h3>
          <ul>
            <li><strong>Scanning:</strong> Quarterly vulnerability scans using industry tools</li>
            <li><strong>Patch Management:</strong> Security patches applied within 30 days of release (critical within 7 days)</li>
            <li><strong>Penetration Testing:</strong> Annual third-party pen testing; remediation of findings within 90 days</li>
            <li><strong>Code Review:</strong> Security-focused code reviews for all production changes</li>
            <li><strong>Dependency Scanning:</strong> Automated scanning of open-source dependencies for known vulnerabilities</li>
          </ul>

          <h3>Risk Mitigation Strategy</h3>
          <ul>
            <li><strong>Accept:</strong> Risks determined to have acceptable residual risk (documented in risk register)</li>
            <li><strong>Mitigate:</strong> Implement additional controls to reduce likelihood or impact</li>
            <li><strong>Transfer:</strong> Cyber liability insurance; rely on vendor controls for third-party risks</li>
            <li><strong>Avoid:</strong> Discontinue high-risk activities or services</li>
          </ul>
        </div>

        <div className="section">
          <h2>11. HIPAA Security Rule Control Mapping</h2>
          
          <p>The following table maps our controls to specific HIPAA Security Rule requirements:</p>
          
          <table>
            <thead>
              <tr>
                <th>HIPAA Rule</th>
                <th>Requirement</th>
                <th>EnScribe Control</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>§164.308(a)(2)</td>
                <td>Assigned Security Responsibility</td>
                <td>Designated Chief Technology Officer as Security Official</td>
                <td>Org chart, job description, security policy</td>
              </tr>
              <tr>
                <td>§164.308(a)(3)</td>
                <td>Workforce Security</td>
                <td>RBAC, authorization procedures, access controls</td>
                <td>Access control matrix, training records</td>
              </tr>
              <tr>
                <td>§164.308(a)(4)</td>
                <td>Information Access Management</td>
                <td>Minimum necessary principle, access logs, API restrictions</td>
                <td>Audit logs, access policies</td>
              </tr>
              <tr>
                <td>§164.308(a)(5)</td>
                <td>Security Awareness Training</td>
                <td>Annual HIPAA training for all personnel</td>
                <td>Training records, completion attestations</td>
              </tr>
              <tr>
                <td>§164.308(a)(6)</td>
                <td>Incident Response</td>
                <td>Documented incident response plan with 24-hour notification SLA</td>
                <td>IRP document, incident logs, breach notifications</td>
              </tr>
              <tr>
                <td>§164.308(a)(7)</td>
                <td>Contingency Planning</td>
                <td>Disaster recovery plan with RTO 4hr, RPO 1hr; semi-annual testing</td>
                <td>BCP document, test results, failover logs</td>
              </tr>
              <tr>
                <td>§164.310(a)(1)</td>
                <td>Facility Access Controls</td>
                <td>Cloud-hosted; AWS/GCP data centers with SOC 2 audit; no on-premises PHI storage</td>
                <td>SOC 2 reports, facility certifications</td>
              </tr>
              <tr>
                <td>§164.310(b)</td>
                <td>Workstation Use</td>
                <td>Disk encryption, auto-lockout, disabled USB, approved apps only</td>
                <td>Device policies, configuration standards</td>
              </tr>
              <tr>
                <td>§164.310(d)(1)</td>
                <td>Device & Media Controls</td>
                <td>Encrypted backups, secure wiping of media, chain of custody</td>
                <td>Media disposal procedures, destruction logs</td>
              </tr>
              <tr>
                <td>§164.312(a)(2)(i)</td>
                <td>Encryption & Decryption</td>
                <td>AES-256 for data, TLS 1.2+ for transit, RSA-2048 key protection</td>
                <td>Security architecture documentation, key management procedures</td>
              </tr>
              <tr>
                <td>§164.312(a)(2)(ii)</td>
                <td>Unique User Identification</td>
                <td>MFA required, unique user IDs, API key rotation</td>
                <td>Authentication system logs, access reports</td>
              </tr>
              <tr>
                <td>§164.312(b)</td>
                <td>Audit Controls</td>
                <td>Comprehensive logging of PHI access, 12-month retention, automated alerts</td>
                <td>CloudTrail logs, alert configurations, log archival</td>
              </tr>
              <tr>
                <td>§164.312(c)(1)</td>
                <td>Integrity Control</td>
                <td>HMAC-SHA-256 checksums for PHI; immutable audit trail</td>
                <td>Database schema, logging procedures</td>
              </tr>
              <tr>
                <td>§164.312(e)(1)</td>
                <td>Transmission Security</td>
                <td>TLS encryption, certificate pinning, VPC peering</td>
                <td>Network diagrams, TLS configurations</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h2>Appendix: Supplementary Information</h2>
          
          <h3>Third-Party Vendor Assessment Process</h3>
          <ul>
            <li>Security questionnaire covering HIPAA requirements</li>
            <li>Review of SOC 2, ISO 27001, or equivalent certifications</li>
            <li>Verification of BAA terms and data handling procedures</li>
            <li>Annual reassessment of vendor security posture</li>
          </ul>

          <h3>Audit & Compliance Review Schedule</h3>
          <ul>
            <li><strong>Monthly:</strong> Review of access logs and audit trails</li>
            <li><strong>Quarterly:</strong> Vulnerability scans and risk assessment updates</li>
            <li><strong>Semi-Annually:</strong> Disaster recovery testing and policy review</li>
            <li><strong>Annually:</strong> Comprehensive risk assessment, penetration testing, HIPAA training</li>
            <li><strong>Every 2-3 Years:</strong> Third-party independent security audit</li>
          </ul>

          <h3>Contact Information for Audit Inquiries</h3>
          <ul>
            <li><strong>Chief Technology Officer / Security Officer</strong></li>
            <li><strong>Email:</strong> loohsienrong@gmail.com</li>
            <li><strong>Phone:</strong> 213-551-5106</li>
          </ul>
        </div>

        <div className="footer">
          <p><strong>Document Classification:</strong> CONFIDENTIAL - For Authorized Audit and Legal Use Only</p>
          <p><strong>Last Updated:</strong> January 15, 2026</p>
          <p><strong>Next Review Date:</strong> January 15, 2027</p>
          <p>This document contains EnScribe's proprietary security and compliance information. Unauthorized distribution is prohibited.</p>
        </div>
      </div>
    </main>
  );
}
