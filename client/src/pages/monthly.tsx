import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadBanner from "@/components/upload/upload-banner";
import { useStore } from "@/store/data-store";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Monthly() {
  const { uploadStatus, monthlyData } = useStore();
  const [activeMonth, setActiveMonth] = useState("January");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark mb-1">Month-by-Month Analysis</h1>
        <p className="text-neutral-text">Detailed monthly financial breakdowns</p>
      </div>

      <Card className="overflow-hidden">
        <Tabs value={activeMonth} onValueChange={setActiveMonth} className="w-full">
          <TabsList className="flex overflow-x-auto scrollbar-hide border-b border-neutral-border rounded-none bg-white h-auto">
            {months.map((month) => {
              const monthlyStatus = uploadStatus.monthly[month.toLowerCase()];
              const isActive = activeMonth === month;
              const isDisabled = !monthlyStatus?.e && !monthlyStatus?.o;
              
              return (
                <TabsTrigger
                  key={month}
                  value={month}
                  disabled={isDisabled}
                  className={`flex-none px-6 py-4 ${
                    isActive 
                      ? "text-primary border-b-2 border-primary font-medium" 
                      : "text-neutral-text hover:text-neutral-dark"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {month}
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {months.map((month) => {
            const monthlyStatus = uploadStatus.monthly[month.toLowerCase()];
            const eUploaded = !!monthlyStatus?.e;
            const oUploaded = !!monthlyStatus?.o;
            const allUploaded = eUploaded && oUploaded;
            
            return (
              <TabsContent key={month} value={month} className="p-6">
                {!allUploaded && (
                  <UploadBanner
                    title={`${month} Data Upload Required`}
                    message={`Please upload both the Employee (E) and Other Businesses (O) CSV files for ${month} to view detailed performance metrics.`}
                    buttonText=""
                    uploadType="monthly"
                    month={month.toLowerCase()}
                    showEOButtons={true}
                    eUploaded={eUploaded}
                    oUploaded={oUploaded}
                  />
                )}
                
                {allUploaded && (
                  <div className="space-y-6">
                    {/* Monthly Financial Snapshot */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold numeric">$284,530</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold numeric">$221,650</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-neutral-text text-sm font-medium">Net Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold numeric">$62,880</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Line Item Breakdown Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Line Item Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-border">
                                <th className="text-left py-3 px-4 font-medium">Line Item</th>
                                <th className="text-right py-3 px-4 font-medium">Dr. Smith</th>
                                <th className="text-right py-3 px-4 font-medium">Dr. Johnson</th>
                                <th className="text-right py-3 px-4 font-medium">Dr. Lee</th>
                                <th className="text-right py-3 px-4 font-medium">All Employees</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-neutral-border">
                                <td className="py-3 px-4 font-semibold">Revenue</td>
                                <td className="text-right py-3 px-4 numeric">$95,450</td>
                                <td className="text-right py-3 px-4 numeric">$82,340</td>
                                <td className="text-right py-3 px-4 numeric">$78,520</td>
                                <td className="text-right py-3 px-4 font-medium numeric">$284,530</td>
                              </tr>
                              <tr className="border-b border-neutral-border bg-neutral-bg">
                                <td className="py-3 px-4 pl-8">Professional Fees</td>
                                <td className="text-right py-3 px-4 numeric">$71,250</td>
                                <td className="text-right py-3 px-4 numeric">$65,780</td>
                                <td className="text-right py-3 px-4 numeric">$62,340</td>
                                <td className="text-right py-3 px-4 numeric">$214,680</td>
                              </tr>
                              <tr className="border-b border-neutral-border bg-neutral-bg">
                                <td className="py-3 px-4 pl-8">Ancillary Revenue</td>
                                <td className="text-right py-3 px-4 numeric">$24,200</td>
                                <td className="text-right py-3 px-4 numeric">$16,560</td>
                                <td className="text-right py-3 px-4 numeric">$16,180</td>
                                <td className="text-right py-3 px-4 numeric">$69,850</td>
                              </tr>
                              <tr className="border-b border-neutral-border">
                                <td className="py-3 px-4 font-semibold">Expenses</td>
                                <td className="text-right py-3 px-4 numeric">$72,340</td>
                                <td className="text-right py-3 px-4 numeric">$65,780</td>
                                <td className="text-right py-3 px-4 numeric">$68,920</td>
                                <td className="text-right py-3 px-4 font-medium numeric">$221,650</td>
                              </tr>
                              <tr className="border-b border-neutral-border bg-neutral-bg">
                                <td className="py-3 px-4 pl-8">Payroll</td>
                                <td className="text-right py-3 px-4 numeric">$52,450</td>
                                <td className="text-right py-3 px-4 numeric">$48,920</td>
                                <td className="text-right py-3 px-4 numeric">$50,340</td>
                                <td className="text-right py-3 px-4 numeric">$159,780</td>
                              </tr>
                              <tr className="border-b border-neutral-border bg-neutral-bg">
                                <td className="py-3 px-4 pl-8">Operating</td>
                                <td className="text-right py-3 px-4 numeric">$11,230</td>
                                <td className="text-right py-3 px-4 numeric">$9,450</td>
                                <td className="text-right py-3 px-4 numeric">$10,120</td>
                                <td className="text-right py-3 px-4 numeric">$35,680</td>
                              </tr>
                              <tr className="border-b border-neutral-border bg-neutral-bg">
                                <td className="py-3 px-4 pl-8">Admin</td>
                                <td className="text-right py-3 px-4 numeric">$8,660</td>
                                <td className="text-right py-3 px-4 numeric">$7,410</td>
                                <td className="text-right py-3 px-4 numeric">$8,460</td>
                                <td className="text-right py-3 px-4 numeric">$26,190</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-semibold">Net Income</td>
                                <td className="text-right py-3 px-4 numeric font-medium text-positive">$23,110</td>
                                <td className="text-right py-3 px-4 numeric font-medium text-positive">$16,560</td>
                                <td className="text-right py-3 px-4 numeric font-medium text-positive">$9,600</td>
                                <td className="text-right py-3 px-4 font-medium numeric text-positive">$62,880</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Entity-Level Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Doctor Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] flex items-center justify-center">
                            <p className="text-neutral-text">Doctor performance charts will appear here.</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Department Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] flex items-center justify-center">
                            <p className="text-neutral-text">Department performance charts will appear here.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}
