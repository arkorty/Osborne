"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModalComponent = ({ isOpen, onClose }: DisclaimerModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-auto">
      <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col mx-auto my-auto">
        <CardHeader className="flex-shrink-0 sticky top-0 bg-card z-10 border-b">
          <CardTitle className="flex items-center justify-between">
            Legal Terms & Disclaimers
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto scrollbar-hide p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="font-semibold text-base mb-3">Terms of Service & User Agreement</h3>
              <p>
                By accessing and using this collaborative text editing service (&quot;Osborne&quot;), you acknowledge 
                that you have read, understood, and agree to be bound by these terms and conditions. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Service Description</h3>
              <p>
                Osborne is a real-time collaborative text editing platform that allows multiple users to 
                simultaneously edit documents, share code, and collaborate on text-based projects. The service 
                is provided &quot;as is&quot; without warranties of any kind.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">User Content & Liability Disclaimer</h3>
              <p className="mb-3">
                <strong>IMPORTANT:</strong> Users are solely responsible for all content they create, upload, 
                share, or collaborate on through our platform. We do not monitor, review, or control user-generated content.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
                <h4 className="font-semibold mb-2">Content Liability Waiver</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We are not responsible for any content created or shared by users</li>
                  <li>We do not endorse, verify, or guarantee the accuracy of user content</li>
                  <li>Users assume full legal responsibility for their content and actions</li>
                  <li>We reserve the right to remove content that violates our terms or applicable laws</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Privacy & Data Handling</h3>
              <p className="mb-3">Your privacy is important to us. Here&apos;s how we handle your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Document Content:</strong> Stored temporarily for collaboration; users control persistence</li>
                <li><strong>No Personal Data Collection:</strong> We don&apos;t require registration or collect personal information</li>
                <li><strong>Session Data:</strong> Room codes and collaborative sessions are temporary</li>
                <li><strong>No Tracking:</strong> We don&apos;t use analytics or tracking cookies</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Acceptable Use Policy</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-green-700 dark:text-green-400">✓ Permitted Uses:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Collaborative document editing and code sharing</li>
                    <li>Educational and professional projects</li>
                    <li>Open source development and documentation</li>
                    <li>Creative writing and content creation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-400">✗ Prohibited Uses:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Illegal activities or content that violates applicable laws</li>
                    <li>Harassment, hate speech, or discriminatory content</li>
                    <li>Copyrighted material without proper authorization</li>
                    <li>Malicious code, viruses, or security threats</li>
                    <li>Spam, phishing, or fraudulent activities</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Service Availability & Technical Disclaimers</h3>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p><strong>No Uptime Guarantees:</strong> Service availability is not guaranteed; planned and unplanned outages may occur.</p>
                <p><strong>Data Loss Risk:</strong> Users should maintain backups; we&apos;re not liable for any data loss or corruption.</p>
                <p><strong>Beta Software:</strong> This service may contain bugs, errors, or incomplete features.</p>
                <p><strong>No Support Obligation:</strong> Technical support is provided on a best-effort basis.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
                DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Intellectual Property</h3>
              <p className="mb-3">
                Users retain ownership of their original content. By using our service, users grant us a 
                limited license to host, store, and facilitate collaboration on their content solely for 
                the purpose of providing the service.
              </p>
              <p>
                The Osborne platform, its code, design, and functionality are protected by intellectual 
                property laws and remain the property of WebArk and its licensors.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Termination</h3>
              <p>
                We reserve the right to terminate or suspend access to our service at any time, without 
                prior notice, for conduct that we believe violates these terms or is harmful to other 
                users, us, or third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Governing Law</h3>
              <p>
                These terms shall be interpreted and governed in accordance with applicable laws. 
                Any disputes shall be resolved through appropriate legal channels.
              </p>
            </section>

            <section className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Last Updated:</strong> October 31, 2025<br/>
                These terms are subject to change. Continued use of the service constitutes acceptance of any modifications.
                For questions or concerns, contact: mail@webark.in
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};