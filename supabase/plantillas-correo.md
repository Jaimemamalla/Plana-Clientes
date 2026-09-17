# Plantillas de correo de Supabase

Se pegan en **Authentication → Emails → Templates**, una por una. El "Subject"
y el "Message body" son campos separados en ese formulario.

## Invite user (invitación de acceso)

**Subject:**
```
Tu acceso al área de clientes de Plana
```

**Message body:**
```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#10243A;">
  <div style="margin-bottom:24px;">
    <span style="display:inline-block;width:14px;height:14px;background:#4FB3E8;border-radius:50%;vertical-align:middle;"></span>
    <span style="font-weight:700;font-size:18px;vertical-align:middle;margin-left:8px;">plana</span>
  </div>
  <h1 style="font-size:20px;margin:0 0 16px;">Ya tienes acceso al área de clientes</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 24px;">
    Desde aquí puedes seguir tus vacantes, ver a los finalistas, tus facturas
    y los informes de cada proceso. Solo falta que crees tu contraseña.
  </p>
  <p style="text-align:center;margin:0 0 24px;">
    <a href="{{ .ConfirmationURL }}" style="background:#FFD75E;color:#10243A;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:999px;display:inline-block;">Crear mi contraseña</a>
  </p>
  <p style="font-size:13px;color:#6B7C8C;line-height:1.5;">
    Si no esperabas este correo, puedes ignorarlo con tranquilidad.
    ¿Dudas? Escríbenos a <a href="mailto:hello@beplana.com" style="color:#4FB3E8;">hello@beplana.com</a>.
  </p>
</div>
```

## Reset Password (recuperar contraseña)

**Subject:**
```
Crea una contraseña nueva para el área de clientes
```

**Message body:**
```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#10243A;">
  <div style="margin-bottom:24px;">
    <span style="display:inline-block;width:14px;height:14px;background:#4FB3E8;border-radius:50%;vertical-align:middle;"></span>
    <span style="font-weight:700;font-size:18px;vertical-align:middle;margin-left:8px;">plana</span>
  </div>
  <h1 style="font-size:20px;margin:0 0 16px;">Pediste crear una contraseña nueva</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 24px;">
    Para el área de clientes de Plana. El enlace caduca pronto, así que
    conviene usarlo en cuanto puedas.
  </p>
  <p style="text-align:center;margin:0 0 24px;">
    <a href="{{ .ConfirmationURL }}" style="background:#FFD75E;color:#10243A;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:999px;display:inline-block;">Crear contraseña nueva</a>
  </p>
  <p style="font-size:13px;color:#6B7C8C;line-height:1.5;">
    Si no has sido tú, puedes ignorar este correo: tu contraseña actual
    sigue funcionando igual. ¿Dudas? Escríbenos a
    <a href="mailto:hello@beplana.com" style="color:#4FB3E8;">hello@beplana.com</a>.
  </p>
</div>
```

## Por qué ayuda

- Marca visible (logo, colores) en vez de una plantilla genérica: es lo que
  más distingue un correo real de una plantilla de phishing masivo.
- Sin lenguaje de urgencia ("verifica ya", "tu cuenta será suspendida").
- Explica qué es y por qué llega, con una salida clara ("si no esperabas
  esto, ignóralo") en vez de solo un enlace suelto.
- Un contacto real (`hello@beplana.com`) al final.

Esto reduce el riesgo, pero no lo elimina del todo: la reputación del
dominio de envío (`notificaciones.beplana.com`, muy nuevo todavía) también
cuenta, y esa parte solo mejora enviando correo legítimo con el tiempo.
