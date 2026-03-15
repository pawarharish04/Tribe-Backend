import PageTransition from '../../components/PageTransition';

export default function ProtectedTemplate({ children }: { children: React.ReactNode }) {
    return <PageTransition>{children}</PageTransition>;
}
