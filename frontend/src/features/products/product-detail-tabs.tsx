import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ProductDetailTabsProps = {
  description: string;
  benefits: string[];
  howToUse: string;
  ingredients: string[];
};

export function ProductDetailTabs({
  description,
  benefits,
  howToUse,
  ingredients,
}: ProductDetailTabsProps) {
  const t = useTranslations('products');

  return (
    <Tabs defaultValue="benefits" className="gap-5">
      <TabsList
        variant="line"
        className="w-full justify-start gap-6 border-b border-border/70 px-0 pb-0"
      >
        <TabsTrigger
          value="benefits"
          className="h-12 border-none bg-transparent px-0 text-sm font-medium shadow-none"
        >
          {t('detailTabBenefits')}
        </TabsTrigger>
        <TabsTrigger
          value="how-to-use"
          className="h-12 border-none bg-transparent px-0 text-sm font-medium shadow-none"
        >
          {t('detailTabHowToUse')}
        </TabsTrigger>
        <TabsTrigger
          value="ingredients"
          className="h-12 border-none bg-transparent px-0 text-sm font-medium shadow-none"
        >
          {t('detailTabIngredients')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="benefits" className="outline-none">
        <Card className="border-border/80 bg-card/96 shadow-[0_20px_60px_rgba(132,83,60,0.06)]">
          <CardHeader>
            <CardTitle>{t('formulaHighlightsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="max-w-3xl leading-8 text-muted-foreground">
              {description}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[1.35rem] border border-border/80 bg-background/80 px-4 py-4 text-sm leading-7 text-foreground"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="how-to-use" className="outline-none">
        <Card className="border-border/80 bg-card/96 shadow-[0_20px_60px_rgba(132,83,60,0.06)]">
          <CardHeader>
            <CardTitle>{t('routineGuideTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-3xl leading-8 text-muted-foreground">
              {howToUse}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ingredients" className="outline-none">
        <Card className="border-border/80 bg-card/96 shadow-[0_20px_60px_rgba(132,83,60,0.06)]">
          <CardHeader>
            <CardTitle>{t('ingredientListTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient}
                  className="rounded-[1.2rem] border border-border/80 bg-background/80 px-4 py-3 text-sm font-medium text-foreground"
                >
                  {ingredient}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
