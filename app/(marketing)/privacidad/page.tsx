import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Política de privacidad | Punta Cana Academy',
	description: 'Información sobre el tratamiento y la protección de datos personales en Punta Cana Academy.',
};

export default function PrivacyPolicyPage() {
	return (
		<main className="min-h-screen bg-pca-black px-6 py-24 text-white">
			<article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl sm:p-12">
				<p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
					Punta Cana Academy
				</p>
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Política de privacidad</h1>
				<p className="mt-6 text-base leading-8 text-slate-300">
					En Punta Cana Academy valoramos tu privacidad y nos comprometemos a proteger tu información personal.
				</p>

				<div className="mt-8 space-y-6 text-sm leading-7 text-slate-300">
					<section>
						<h2 className="text-lg font-semibold text-white">Información que recopilamos</h2>
						<p className="mt-2">
							Podemos recopilar los datos necesarios para crear tu cuenta, gestionar tus cursos, procesar tu progreso
							académico y comunicarnos contigo sobre el servicio.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-white">Uso de la información</h2>
						<p className="mt-2">
							Utilizamos la información para prestar y mejorar la plataforma, proteger las cuentas, mantener la
							seguridad del servicio y cumplir con nuestras obligaciones legales.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-white">Protección de datos</h2>
						<p className="mt-2">
							Aplicamos controles técnicos y organizativos razonables para proteger la información frente a accesos,
							alteraciones o divulgaciones no autorizadas.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-white">Tus derechos</h2>
						<p className="mt-2">
							Puedes solicitar acceso, corrección o eliminación de tus datos personales, sujeto a las obligaciones
							legales aplicables. Para ejercer estos derechos, ponte en contacto con el equipo de Punta Cana Academy.
						</p>
					</section>
				</div>
			</article>
		</main>
	);
}