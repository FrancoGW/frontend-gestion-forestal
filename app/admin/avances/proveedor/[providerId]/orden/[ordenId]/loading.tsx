import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-6 w-24 mx-auto mb-1" />
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-6 w-24 mx-auto mb-1" />
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Skeleton className="h-6 w-16 mx-auto mb-1" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                      </div>
                      <div>
                        <Skeleton className="h-6 w-16 mx-auto mb-1" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div>
          <Skeleton className="h-6 w-48 mb-4" />

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-4 w-full">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-32" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>

                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-start md:justify-center items-start md:items-center gap-4 md:gap-2 md:min-w-[120px]">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
