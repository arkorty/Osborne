"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DMCAComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* DMCA Button */}
      <Button
        variant="link"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs underline p-0 h-auto text-muted-foreground"
      >
        DMCA Notice & Copyright Policy
      </Button>

      {/* DMCA Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
          <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col mx-auto my-auto">
            <CardHeader className="flex-shrink-0 sticky top-0 bg-card z-10 border-b">
              <CardTitle className="flex items-center justify-between">
                DMCA Copyright Policy & Takedown Notice
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm flex-1 overflow-y-auto scrollbar-hide">
              {/* Introduction */}
              <section>
                <p className="mb-4">
                  Osborne respects the intellectual property rights of others and expects users 
                  to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), 
                  we will respond to valid takedown notices for copyrighted material.
                </p>
              </section>

              {/* DMCA Takedown Process */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Filing a DMCA Takedown Notice</h3>
                <p className="mb-3">
                  If you believe that content on Osborne infringes your copyright, you may 
                  submit a DMCA takedown notice. Your notice must include all of the following:
                </p>
                <div className="space-y-2 pl-4">
                  <p>
                    <strong>1. Identification of the copyrighted work:</strong> Describe the 
                    copyrighted work that you claim has been infringed, or if multiple works 
                    are involved, provide a representative list.
                  </p>
                  <p>
                    <strong>2. Identification of the infringing material:</strong> Identify 
                    the specific content that is allegedly infringing, including the room code, 
                    specific text, files, or other content, and provide enough detail for us 
                    to locate it.
                  </p>
                  <p>
                    <strong>3. Your contact information:</strong> Include your name, mailing 
                    address, telephone number, and email address.
                  </p>
                  <p>
                    <strong>4. Good faith statement:</strong> Include the following statement: 
                    &quot;I have a good faith belief that use of the copyrighted material described 
                    above is not authorized by the copyright owner, its agent, or the law.&quot;
                  </p>
                  <p>
                    <strong>5. Accuracy statement:</strong> Include the following statement: 
                    &quot;I swear, under penalty of perjury, that the information in this 
                    notification is accurate and that I am the copyright owner or am authorized 
                    to act on behalf of the owner of an exclusive right that is allegedly infringed.&quot;
                  </p>
                  <p>
                    <strong>6. Your signature:</strong> Provide your physical or electronic signature.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="text-lg font-semibold mb-3">DMCA Agent Contact</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="mb-2">
                    <strong>DMCA Agent:</strong> [Your Name or Designated Agent]
                  </p>
                  <p className="mb-2">
                    <strong>Email:</strong> dmca@[your-domain].com
                  </p>
                  <p className="mb-2">
                    <strong>Mailing Address:</strong><br />
                    [Your Name/Company]<br />
                    [Street Address]<br />
                    [City, State ZIP Code]<br />
                    [Country]
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Please note: Only DMCA takedown notices should be sent to this contact. 
                    Other inquiries will not receive a response.
                  </p>
                </div>
              </section>

              {/* Counter-Notification */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Counter-Notification Process</h3>
                <p className="mb-3">
                  If you believe your content was removed in error, you may file a 
                  counter-notification under Section 512(g)(3) of the DMCA. Your 
                  counter-notification must include:
                </p>
                <div className="space-y-2 pl-4">
                  <p>
                    <strong>1.</strong> Your physical or electronic signature
                  </p>
                  <p>
                    <strong>2.</strong> Identification of the content that was removed 
                    and its location before removal
                  </p>
                  <p>
                    <strong>3.</strong> A statement under penalty of perjury that you 
                    have a good faith belief the content was removed due to mistake or 
                    misidentification
                  </p>
                  <p>
                    <strong>4.</strong> Your name, address, and telephone number
                  </p>
                  <p>
                    <strong>5.</strong> A statement consenting to jurisdiction in your 
                    district or the district where the service provider is located
                  </p>
                </div>
              </section>

              {/* Safe Harbor and Liability */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Safe Harbor Protection</h3>
                <div className="space-y-3">
                  <p>
                    <strong>Service Provider Status:</strong> Osborne qualifies as a service 
                    provider under the DMCA safe harbor provisions. We do not pre-screen, 
                    monitor, or exercise editorial control over user-generated content.
                  </p>
                  <p>
                    <strong>No Knowledge of Infringement:</strong> We have no actual knowledge 
                    of infringing activity and are not aware of facts or circumstances from 
                    which infringing activity is apparent.
                  </p>
                  <p>
                    <strong>Expeditious Removal:</strong> Upon receiving a valid DMCA takedown 
                    notice, we will expeditiously remove or disable access to the allegedly 
                    infringing content.
                  </p>
                  <p>
                    <strong>No Financial Benefit:</strong> We do not receive a financial 
                    benefit directly attributable to infringing activity when we have the 
                    right and ability to control such activity.
                  </p>
                </div>
              </section>

              {/* Response Timeline */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Response Timeline</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Takedown Notices:</strong> We will respond to valid DMCA takedown 
                    notices within 24-48 hours of receipt.
                  </p>
                  <p>
                    <strong>Counter-Notifications:</strong> Counter-notifications will be 
                    forwarded to the original complainant within 10 business days, and content 
                    may be restored 10-14 business days after forwarding unless the complainant 
                    files a court action.
                  </p>
                  <p>
                    <strong>Invalid Notices:</strong> Notices that do not substantially comply 
                    with DMCA requirements may not be processed.
                  </p>
                </div>
              </section>

              {/* Repeat Offender Policy */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Repeat Offender Policy</h3>
                <p>
                  In appropriate circumstances, Osborne will terminate users who are repeat 
                  infringers. We may also, at our sole discretion, limit access to the service 
                  and/or terminate accounts of users who infringe any intellectual property 
                  rights of others, whether or not there is any repeat infringement.
                </p>
              </section>

              {/* False Claims Warning */}
              <section>
                <h3 className="text-lg font-semibold mb-3">False Claims Warning</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Under Section 512(f) of the DMCA, any person 
                    who knowingly materially misrepresents that content is infringing may be 
                    subject to liability for damages. Do not submit false claims.
                  </p>
                </div>
              </section>

              {/* Footer */}
              <div className="border-t pt-4 text-center text-muted-foreground">
                <p>Last Updated: {new Date().toLocaleDateString()}</p>
                <p className="mt-2 text-xs">
                  This DMCA policy is designed to comply with the Digital Millennium Copyright Act 
                  and protect both content creators and service providers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};