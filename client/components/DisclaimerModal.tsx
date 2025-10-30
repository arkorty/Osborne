"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DisclaimerComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Disclaimer Button */}
      <Button
        variant="link"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs underline p-0 h-auto text-muted-foreground"
      >
        View Full Legal Terms & Disclaimers
      </Button>

      {/* Disclaimer Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col mx-auto my-auto">
            <CardHeader className="flex-shrink-0 sticky top-0 bg-card z-10 border-b">
              <CardTitle className="flex items-center justify-between">
                Legal Terms & Disclaimers
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm flex-1 overflow-y-auto scrollbar-hide">
              {/* Terms of Service */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Terms of Service</h3>
                <div className="space-y-3">
                  <p>
                    <strong>1. Acceptance of Terms:</strong> By accessing or using Osborne (&quot;the Service&quot;), 
                    you agree to be bound by these Terms of Service. If you do not agree to these terms, 
                    you may not use the Service.
                  </p>
                  <p>
                    <strong>2. Service Description:</strong> Osborne is a real-time collaborative text editor 
                    that allows users to create and join rooms for collaborative editing. The Service is 
                    provided &quot;as is&quot; without warranty of any kind.
                  </p>
                  <p>
                    <strong>3. User Responsibilities:</strong> You are solely responsible for all content 
                    you upload, share, or transmit through the Service. You agree not to use the Service 
                    for any illegal, harmful, or inappropriate purposes.
                  </p>
                  <p>
                    <strong>4. Content Ownership:</strong> You retain ownership of your content. However, 
                    by using the Service, you grant us a non-exclusive, royalty-free license to host, 
                    store, and transmit your content as necessary to provide the Service.
                  </p>
                  <p>
                    <strong>5. Prohibited Conduct:</strong> You agree not to upload, share, or transmit 
                    content that is illegal, harmful, threatening, abusive, defamatory, obscene, or 
                    otherwise objectionable.
                  </p>
                  <p>
                    <strong>6. Service Availability:</strong> We do not guarantee that the Service will 
                    be available at all times or that it will be error-free. We may modify, suspend, 
                    or discontinue the Service at any time without notice.
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Disclaimer of Liability</h3>
                <div className="space-y-3">
                  <p>
                    <strong>1. User-Generated Content:</strong> The Service allows users to upload and 
                    share content. We do not monitor, review, or control user-generated content and 
                    are not responsible for any content uploaded by users.
                  </p>
                  <p>
                    <strong>2. No Warranty:</strong> THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; 
                    WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    <strong>3. Limitation of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, 
                    WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                    PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY 
                    OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p>
                    <strong>4. Third-Party Content:</strong> We are not responsible for content uploaded 
                    by third parties. Users upload content at their own risk. We do not endorse, 
                    support, or guarantee the accuracy or reliability of any user-generated content.
                  </p>
                  <p>
                    <strong>5. Security:</strong> While we implement reasonable security measures, we 
                    cannot guarantee the security of data transmitted through the Service. Users 
                    transmit data at their own risk.
                  </p>
                  <p>
                    <strong>6. Indemnification:</strong> You agree to indemnify and hold us harmless 
                    from any claims, damages, losses, or expenses arising from your use of the Service 
                    or violation of these terms.
                  </p>
                </div>
              </section>

              {/* Copyright and DMCA */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Copyright & Intellectual Property</h3>
                <div className="space-y-3">
                  <p>
                    <strong>1. Respect for Intellectual Property:</strong> Users must respect the 
                    intellectual property rights of others. Do not upload content that infringes 
                    on copyrights, trademarks, or other intellectual property rights.
                  </p>
                  <p>
                    <strong>2. DMCA Compliance:</strong> We respond to valid DMCA takedown notices. 
                    If you believe your copyrighted work has been infringed, please contact us with 
                    appropriate documentation.
                  </p>
                  <p>
                    <strong>3. Safe Harbor:</strong> We qualify for safe harbor protections under 
                    applicable copyright laws as we are a service provider that hosts user-generated 
                    content without prior review or knowledge of its contents.
                  </p>
                  <p>
                    <strong>4. Content Removal:</strong> We reserve the right to remove any content 
                    that we believe, in our sole discretion, violates these terms or applicable laws.
                  </p>
                  <p>
                    <strong>5. User License:</strong> By uploading content, you represent that you 
                    have the right to upload such content and grant others the ability to view and 
                    collaborate on such content through the Service.
                  </p>
                </div>
              </section>

              {/* Data and Privacy */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Data and Privacy</h3>
                <div className="space-y-3">
                  <p>
                    <strong>1. Data Collection:</strong> We collect minimal data necessary to provide 
                    the Service. We do not sell or share personal information with third parties 
                    except as necessary to operate the Service.
                  </p>
                  <p>
                    <strong>2. Content Storage:</strong> Content uploaded to the Service may be 
                    temporarily stored to enable collaboration. We make no guarantees about data 
                    persistence or backup.
                  </p>
                  <p>
                    <strong>3. No Monitoring:</strong> We do not actively monitor user content or 
                    communications. Any moderation is reactive and based on reports or automated systems.
                  </p>
                </div>
              </section>

              {/* General Provisions */}
              <section>
                <h3 className="text-lg font-semibold mb-3">General Provisions</h3>
                <div className="space-y-3">
                  <p>
                    <strong>1. Changes to Terms:</strong> We may update these terms at any time. 
                    Continued use of the Service constitutes acceptance of updated terms.
                  </p>
                  <p>
                    <strong>2. Governing Law:</strong> These terms are governed by the laws of the 
                    jurisdiction where the service operator resides, without regard to conflict 
                    of law provisions.
                  </p>
                  <p>
                    <strong>3. Severability:</strong> If any provision of these terms is found 
                    unenforceable, the remaining provisions will remain in effect.
                  </p>
                  <p>
                    <strong>4. Contact:</strong> For questions about these terms or to report 
                    violations, contact the service administrator.
                  </p>
                </div>
              </section>

              <div className="border-t pt-4 text-center text-muted-foreground">
                <p>Last Updated: {new Date().toLocaleDateString()}</p>
                <p className="mt-2 font-semibold">
                  BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, 
                  AND AGREE TO BE BOUND BY THESE TERMS.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};