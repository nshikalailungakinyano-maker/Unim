// js/auth.js
import { supabase } from './supabaseClient.js';

// Éléments de navigation entre onglets
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const messageEl = document.getElementById('message');

// Formulaires
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ==========================================
// 1. GESTION DES ONGLETS (CONNEXION / INSCRIPTION)
// ==========================================
tabLogin.addEventListener('click', () => {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
    tabLogin.style.backgroundColor = 'var(--primary)';
    tabRegister.style.backgroundColor = '#64748b';
    messageEl.textContent = '';
});

tabRegister.addEventListener('click', () => {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    tabRegister.style.backgroundColor = 'var(--primary)';
    tabLogin.style.backgroundColor = '#64748b';
    messageEl.textContent = '';
});

// ==========================================
// 2. LOGIQUE DE CONNEXION (LOGIN)
// ==========================================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        messageEl.style.color = 'blue';
        messageEl.textContent = 'Connexion en cours...';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            // Authentification auprès de Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Vérifier si le profil existe et est actif dans la table 'etudiants'
            const { data: profil, error: profilError } = await supabase
                .from('etudiants')
                .select('est_actif, role')
                .eq('id', data.user.id)
                .single();

            if (profilError) throw profilError;

            if (!profil.est_actif) {
                await supabase.auth.signOut();
                throw new Error("Votre compte a été suspendu. Contactez l'administration UNIM.");
            }

            messageEl.style.color = 'green';
            messageEl.textContent = 'Connexion réussie ! Redirection vers votre espace...';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Erreur connexion :', error.message);
            messageEl.style.color = 'red';
            messageEl.textContent = 'Erreur : ' + (error.message === 'Invalid login credentials' 
                ? 'E-mail ou mot de passe incorrect.' 
                : error.message);
            loginBtn.disabled = false;
        }
    });
}

// ==========================================
// 3. LOGIQUE D'INSCRIPTION (REGISTER)
// ==========================================
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        messageEl.style.color = 'blue';
        messageEl.textContent = 'Création du compte en cours...';

        const nom = document.getElementById('nom').value.trim();
        const postnom = document.getElementById('postnom').value.trim();
        const prenom = document.getElementById('prenom').value.trim();
        const sexe = document.getElementById('sexe').value;
        const matricule = document.getElementById('matricule').value.trim();
        const faculte = document.getElementById('faculte').value.trim();
        const departement = document.getElementById('departement').value.trim();
        const promotion = document.getElementById('promotion').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            // Étape 1 : Inscription dans Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            const userId = authData.user.id;

            // Étape 2 : Insertion des 15 champs dans la table 'etudiants'
            const { error: dbError } = await supabase
                .from('etudiants')
                .insert([
                    {
                        id: userId,
                        nom: nom,
                        postnom: postnom,
                        prenom: prenom,
                        sexe: sexe,
                        email: email,
                        mot_de_passe: password,
                        matricule: matricule,
                        faculte: faculte,
                        departement: departement,
                        promotion: promotion,
                        role: 'etudiant',
                        est_actif: true
                    }
                ]);

            if (dbError) throw dbError;

            messageEl.style.color = 'green';
            messageEl.textContent = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
            registerForm.reset();
            registerBtn.disabled = false;

            // Basculer automatiquement vers l'onglet connexion après 2 secondes
            setTimeout(() => {
                tabLogin.click();
            }, 2000);

        } catch (error) {
            console.error('Erreur inscription :', error.message);
            messageEl.style.color = 'red';
            messageEl.textContent = 'Erreur : ' + error.message;
            registerBtn.disabled = false;
        }
    });
}
