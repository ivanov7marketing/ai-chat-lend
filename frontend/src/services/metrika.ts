export function initMetrika(counterId: string) {
    if (!counterId) return

    // Prevent duplicate initialization
    if ((window as any)[`yaCounter${counterId}`]) {
        return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = `
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym("${counterId}", "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
        });
    `
    document.head.appendChild(script)
    console.log(`[Metrika] Initialized counter ${counterId}`)
}

export function reachGoal(counterId: string | undefined, goalName: string, events?: Record<string, boolean>) {
    if (!counterId) return

    // If events config is provided and this specific goal is strictly set to false, do not fire
    if (events && events[goalName] === false) {
        console.log(`[Metrika] Goal skipped by tenant settings: ${goalName}`)
        return
    }

    try {
        if (typeof (window as any).ym === 'function') {
            ; (window as any).ym(counterId, 'reachGoal', goalName)
            console.log(`[Metrika] Reached goal: ${goalName} for counter ${counterId}`)
        } else {
            console.warn(`[Metrika] Counter not initialized for goal: ${goalName}`)
        }
    } catch (e) {
        console.error('[Metrika] Error reaching goal', e)
    }
}
