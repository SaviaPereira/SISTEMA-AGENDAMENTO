import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-yellow-400">Ops, algo deu errado!</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Código do erro: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-white text-center">Ocorreu um erro inesperado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
