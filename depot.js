// js/depot.js
import { supabase } from './supabaseClient.js';

const depotForm = document.getElementById('depotForm');
const depotMessage = document.getElementById('depotMessage');
const submitBtn = document.getElementById('submitBtn');

// 1. Vérification de la session dès l'ouverture de la page
async function verifierSessionEtudiant() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        alert("🔒 Accès restreint. Vous devez être connecté en tant qu'étudiant pour déposer un TFC.");
        window.location.href = 'index.html';
        return null;
    }
    return session.user.id;
}

// 2. Gestion du formulaire de dépôt
if (depotForm) {
    depotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        depotMessage.style.color = "blue";
        depotMessage.textContent = "Téléchargement du PDF et publication en cours...";

        const userId = await verifierSessionEtudiant();
        if (!userId) return;

        // Récupération des champs du formulaire
        const titre = document.getElementById('titre').value.trim();
        const resume = document.getElementById('resume').value.trim();
        const motsCles = document.getElementById('motsCles').value.trim();
        const directeur = document.getElementById('directeur').value.trim();
        const anneeAcademique = document.getElementById('anneeAcademique').value;
        const fileInput = document.getElementById('fichierPdf');
        const file = fileInput.files[0];

        if (!file) {
            alert("Veuillez sélectionner un fichier PDF.");
            submitBtn.disabled = false;
            return;
        }

        try {
            // Étape A : Upload du fichier PDF dans Supabase Storage (Bucket: 'tfc-documents')
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('tfc-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Récupération de l'URL publique du fichier PDF
            const { data: urlData } = supabase.storage
                .from('tfc-documents')
                .getPublicUrl(filePath);

            const fichierPdfUrl = urlData.publicUrl;

            // Étape B : Insertion des métadonnées dans la table 'tfc'
            const { error: dbError } = await supabase
                .from('tfc')
                .insert([
                    {
                        etudiant_id: userId,
                        titre: titre,
                        resume: resume,
                        mots_cles: motsCles,
                        directeur_recherche: directeur,
                        annee_academique: anneeAcademique,
                        fichier_pdf_url: fichierPdfUrl,
                        statut: 'publie', // Publication automatique selon ton cahier des charges
                        nombre_vues: 0
                    }
                ]);

            if (dbError) throw dbError;

            depotMessage.style.color = "green";
            depotMessage.textContent = "Succès ! Votre TFC a été publié et est maintenant disponible dans la bibliothèque.";
            depotForm.reset();

            setTimeout(() => {
                window.location.href = 'bibliotheque.html';
            }, 3000);

        } catch (error) {
            console.error("Erreur lors du dépôt :", error.message);
            depotMessage.style.color = "red";
            depotMessage.textContent = "Erreur : " + error.message;
            submitBtn.disabled = false;
        }
    });
}
