import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, UserPlus, Lock, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../app/providers/AuthContext';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Alert } from '../shared/components/Alert';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Пожалуйста, введите имя пользователя');
      return;
    }
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      setError('Имя пользователя должно содержать от 3 до 50 символов');
      return;
    }
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(trimmedName)) {
      setError('Имя пользователя может содержать только латинские буквы, цифры, дефис и подчеркивание');
      return;
    }
    if (!password) {
      setError('Пожалуйста, задайте пароль');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      await register({ name: trimmedName, password });
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.data?.errors?.name) {
        setError(err.data.errors.name);
      } else if (err.data?.errors?.password) {
        setError(err.data.errors.password);
      } else if (err.status === 409 || err.message?.includes('already exists')) {
        setError('Пользователь с таким именем уже зарегистрирован');
      } else {
        setError(err.message || 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Radar className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Регистрация аккаунта
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Создайте профиль в системе «Учебный радар»
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            id="register-username"
            label="Имя пользователя"
            type="text"
            required
            autoComplete="username"
            placeholder="student_alex"
            helperText="От 3 до 50 символов (буквы, цифры, _, -)"
            leftIcon={<User className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="register-password"
            label="Пароль"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            helperText="Минимум 6 символов"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            id="register-confirm-password"
            label="Подтверждение пароля"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Создать аккаунт
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
