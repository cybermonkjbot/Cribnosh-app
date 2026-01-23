import { CityJsonLd } from '@/components/CityJsonLd';
import { metadata } from './page.metadata';
export { metadata };

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <CityJsonLd cityName="Birmingham" />
            {children}
        </>
    );
}
