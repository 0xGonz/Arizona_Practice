import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Upload, Check } from "lucide-react";
import { CSVType } from "@/types";
import { useState } from "react";
import { useStore } from "@/store/data-store";

interface UploadBannerProps {
  title: string;
  message: string;
  buttonText: string;
  uploadType: CSVType | 'monthly';
  month?: string;
  showEOButtons?: boolean;
  eUploaded?: boolean;
  oUploaded?: boolean;
}

export default function UploadBanner({
  title,
  message,
  buttonText,
  uploadType,
  month,
  showEOButtons = false,
  eUploaded = false,
  oUploaded = false
}: UploadBannerProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { setUploadStatus } = useStore();

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
    // In a real implementation, this would trigger a modal or redirect to upload page
    
    // For demo purposes, we'll just simulate a successful upload by updating the upload status
    if (uploadType === 'annual') {
      setUploadStatus({ annual: true });
    } else if (uploadType === 'monthly-e' && month) {
      setUploadStatus({ monthly: { [month]: { e: true } } });
    } else if (uploadType === 'monthly-o' && month) {
      setUploadStatus({ monthly: { [month]: { o: true } } });
    }
  };

  const handleEFileUpload = () => {
    if (month) {
      setUploadStatus({ monthly: { [month]: { e: true } } });
    }
  };

  const handleOFileUpload = () => {
    if (month) {
      setUploadStatus({ monthly: { [month]: { o: true } } });
    }
  };

  return (
    <Alert className="bg-blue-50 border border-primary-light mb-6">
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary font-medium">{title}</AlertTitle>
      <AlertDescription className="text-neutral-dark mt-1">
        {message}
        <div className="mt-3 flex space-x-3">
          {buttonText && (
            <Button size="sm" onClick={handleUploadClick}>
              <Upload className="h-4 w-4 mr-1" />
              {buttonText}
            </Button>
          )}
          
          {showEOButtons && (
            <>
              <Button 
                size="sm" 
                variant={eUploaded ? "outline" : "default"} 
                onClick={handleEFileUpload}
                className={eUploaded ? "bg-green-50 border-green-200 text-green-700" : ""}
              >
                {eUploaded ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                {eUploaded ? "E File Uploaded" : "Upload E File"}
              </Button>
              
              <Button 
                size="sm" 
                variant={oUploaded ? "outline" : "default"} 
                onClick={handleOFileUpload}
                className={oUploaded ? "bg-green-50 border-green-200 text-green-700" : ""}
              >
                {oUploaded ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                {oUploaded ? "O File Uploaded" : "Upload O File"}
              </Button>
            </>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
