"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DMCAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DMCAModalComponent = ({ isOpen, onClose }: DMCAModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-auto">
      <Card className="max-w-4xl w-full max-h-[90vh] flex flex-col mx-auto my-auto">
        <CardHeader className="flex-shrink-0 sticky top-0 bg-card z-10 border-b">
          <CardTitle className="flex items-center justify-between">
            DMCA Copyright Policy & Takedown Notice
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto scrollbar-hide p-6">
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="font-semibold text-base mb-3">Digital Millennium Copyright Act (DMCA) Notice</h3>
              <p>
                We respect the intellectual property rights of others and expect our users to do the same. 
                In accordance with the Digital Millennium Copyright Act of 1998 (&quot;DMCA&quot;), we will respond 
                expeditiously to claims of copyright infringement committed using our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Notification of Infringement</h3>
              <p className="mb-3">
                If you believe that your copyrighted work has been copied in a way that constitutes copyright 
                infringement and is accessible via our service, please notify our copyright agent as set forth below.
              </p>
              <p className="mb-3">For your complaint to be valid under the DMCA, you must provide the following information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>A physical or electronic signature of a person authorized to act on behalf of the copyright owner</li>
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate the material</li>
                <li>Information reasonably sufficient to permit us to contact you, including your address, telephone number, and email address</li>
                <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law</li>
                <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Copyright Agent Contact Information</h3>
              <div className="bg-muted p-4 rounded-md">
                <p><strong>Email:</strong> mail@webark.in</p>
                <p><strong>Subject Line:</strong> DMCA Takedown Notice - Osborne Platform</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Counter-Notification</h3>
              <p className="mb-3">
                If you believe that your material has been removed or disabled by mistake or misidentification, 
                you may file a counter-notification with us by providing the following information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your physical or electronic signature</li>
                <li>Identification of the material that has been removed or disabled and the location where it appeared before removal</li>
                <li>A statement under penalty of perjury that you have a good faith belief that the material was removed as a result of mistake or misidentification</li>
                <li>Your name, address, telephone number, and email address</li>
                <li>A statement that you consent to the jurisdiction of the federal court in your district</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Repeat Infringer Policy</h3>
              <p>
                We have adopted a policy of terminating, in appropriate circumstances and at our sole discretion, 
                users who are deemed to be repeat infringers. We may also limit access to our service and/or 
                terminate accounts of users who infringe any intellectual property rights of others.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">User-Generated Content</h3>
              <p>
                Users are solely responsible for the content they upload, share, or collaborate on through our platform. 
                We do not pre-screen user content but reserve the right to remove content that violates our terms 
                or applicable laws, including copyrighted material.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Safe Harbor Compliance</h3>
              <p>
                This service qualifies for safe harbor protections under Section 512 of the DMCA. We act as a 
                service provider and do not have actual knowledge of infringing activity on our system. Upon 
                receiving proper notification of claimed infringement, we will expeditiously remove or disable 
                access to the allegedly infringing material.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Processing Timeline</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid DMCA notices will be processed within 24-48 hours of receipt</li>
                <li>The alleged infringing content will be removed or access disabled pending investigation</li>
                <li>Users will be notified of takedown actions taken against their content</li>
                <li>Counter-notifications will be processed within 10-14 business days as required by law</li>
              </ul>
            </section>

            <section className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Last Updated:</strong> October 31, 2025<br/>
                This DMCA policy is subject to change. Users will be notified of significant changes through our platform.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};